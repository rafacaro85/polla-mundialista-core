import * as fs from 'fs';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, LessThanOrEqual } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ScoringService } from '../scoring/scoring.service';
import { BracketsService } from '../brackets/brackets.service';
import { TournamentService } from '../tournament/tournament.service';
import { KnockoutPhasesService } from '../knockout-phases/knockout-phases.service';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MatchFinishedEvent } from './listeners/match.listener';

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        @InjectRepository(Prediction)
        private predictionsRepository: Repository<Prediction>,
        @InjectRepository(KnockoutPhaseStatus)
        private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
        private scoringService: ScoringService,
        private dataSource: DataSource,
        private bracketsService: BracketsService,
        private tournamentService: TournamentService,
        private knockoutPhasesService: KnockoutPhasesService,
        private eventEmitter: EventEmitter2
    ) { }

    async findAll(userId?: string, isAdmin: boolean = false, tournamentId: string = 'WC2026'): Promise<Match[]> {
        const query = this.matchesRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.predictions', 'prediction', 'prediction.userId = :userId', { userId })
            .where('match.tournamentId = :tournamentId', { tournamentId });

        if (!isAdmin) {
            const unlockedPhases = await this.phaseStatusRepository.find({
                where: { isUnlocked: true, tournamentId }
            });
            const phaseNames = unlockedPhases.map(p => p.phase);
            
            // Si no hay fases desbloqueadas para este torneo, devolver array vacío para evitar errores IN ()
            if (phaseNames.length === 0) {
                return [];
            }
            
            query.andWhere('match.phase IN (:...phases)', { phases: phaseNames });
        }

        return query.orderBy('match.date', 'ASC').getMany();
    }

    async findLive(isAdmin: boolean = false, tournamentId: string = 'WC2026'): Promise<Match[]> {
        // Obtenemos solo las fases desbloqueadas para que no aparezcan en el fixture antes de tiempo
        const unlockedPhases = await this.phaseStatusRepository.find({
            where: { isUnlocked: true, tournamentId }
        });
        const phaseNames = unlockedPhases.map(p => p.phase);

        if (phaseNames.length === 0) {
            return [];
        }

        return this.matchesRepository.find({
            where: {
                phase: In(phaseNames),
                tournamentId
            },
            order: { date: 'ASC' }
        });
    }



    async createMatch(data: {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        externalId?: number;
        tournamentId?: string;
    }): Promise<Match> {
        const newMatch = this.matchesRepository.create({
            ...data,
            tournamentId: data.tournamentId || 'WC2026',
            homeScore: 0,
            awayScore: 0,
            status: 'NS', // Not Started
            isManuallyLocked: false,
        });
        return this.matchesRepository.save(newMatch);
    }

    async findMatchById(id: string): Promise<Match | null> {
        return this.matchesRepository.findOne({ where: { id } });
    }

    async finishMatch(matchId: string, homeScore: number, awayScore: number): Promise<Match> {
        const match = await this.matchesRepository.findOne({
            where: { id: matchId },
            relations: ['predictions']
        });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // 1. Actualizar partido
        match.status = 'FINISHED';
        match.homeScore = homeScore;
        match.awayScore = awayScore;

        // Usamos una transacción para asegurar consistencia
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            await queryRunner.manager.save(match);

            // 2. Calcular puntos para todas las predicciones
            const predictionsToUpdate: Prediction[] = [];

            if (match.predictions) {
                for (const prediction of match.predictions) {
                    const points = this.scoringService.calculatePoints(match, prediction);
                    prediction.points = points;
                    predictionsToUpdate.push(prediction);
                }
            }

            // 3. Guardar predicciones actualizadas
            if (predictionsToUpdate.length > 0) {
                await queryRunner.manager.save(predictionsToUpdate);
            }

            await queryRunner.commitTransaction();

            // 4. Calcular puntos de bracket (fuera de la transacción)
            const winner = homeScore > awayScore ? match.homeTeam : match.awayTeam;
            await this.bracketsService.calculateBracketPoints(matchId, winner);
            console.log(`🏆 Bracket points calculated for match ${matchId}, winner: ${winner}`);

            // 5. Check and unlock next knockout phase if current phase is complete
            if (match.phase) {
                await this.knockoutPhasesService.checkAndUnlockNextPhase(match.phase, match.tournamentId);
                console.log(`🔓 Checked phase unlock for ${match.phase}`);
            }

            // 6. Trigger automático de promoción si es partido de grupo
            if (match.phase === 'GROUP' && match.group) {
                this.tournamentService.promoteFromGroup(match.group)
                    .catch(err => console.error(`❌ Error promoting from group ${match.group}:`, err));
            }

            return match;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
    }

    async updateMatch(id: string, data: any): Promise<Match> {
        const match = await this.matchesRepository.findOne({
            where: { id },
            relations: ['predictions']
        });
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        const wasNotFinished = match.status !== 'FINISHED';

        if (data.status !== undefined) match.status = data.status;
        if (data.homeScore !== undefined) match.homeScore = data.homeScore;
        if (data.awayScore !== undefined) match.awayScore = data.awayScore;
        if (data.phase !== undefined) match.phase = data.phase;
        if (data.group !== undefined) match.group = data.group;
        if (data.homeTeamPlaceholder !== undefined) match.homeTeamPlaceholder = data.homeTeamPlaceholder;
        if (data.awayTeamPlaceholder !== undefined) match.awayTeamPlaceholder = data.awayTeamPlaceholder;
        if (data.homeTeam !== undefined) match.homeTeam = data.homeTeam;
        if (data.awayTeam !== undefined) match.awayTeam = data.awayTeam;
        if (data.homeFlag !== undefined) match.homeFlag = data.homeFlag;
        if (data.awayFlag !== undefined) match.awayFlag = data.awayFlag;
        if (data.date !== undefined) match.date = data.date;
        if (data.bracketId !== undefined) match.bracketId = data.bracketId;
        if (data.nextMatchId !== undefined) match.nextMatchId = data.nextMatchId;
        if (data.isManuallyLocked !== undefined) match.isManuallyLocked = data.isManuallyLocked;

        const savedMatch = await this.matchesRepository.save(match);

        // 🔥 CRITICAL: Recalculate prediction points (ASYNC via Event)
        if (wasNotFinished && match.status === 'FINISHED' &&
            match.homeScore !== null && match.awayScore !== null) {

            // Emit event to handle scoring and progression asynchronously
            // We use emitAsync but we don't await it here to let the HTTP response return immediately
            this.eventEmitter.emit('match.finished', new MatchFinishedEvent(savedMatch, match.homeScore, match.awayScore));
            console.log(`⚡ Event 'match.finished' emitted for match ${id}`);
        }

        return savedMatch;
    }

    async seedRound32(): Promise<{ message: string; created: number }> {
        // Usamos QueryBuilder para borrar cascada manualmente si es necesario o por phase
        await this.matchesRepository.delete({ phase: 'ROUND_32' });
        await this.matchesRepository.delete({ phase: 'ROUND_16' });
        await this.matchesRepository.delete({ phase: 'QUARTER' });
        await this.matchesRepository.delete({ phase: 'SEMI' });
        await this.matchesRepository.delete({ phase: '3RD_PLACE' });
        await this.matchesRepository.delete({ phase: 'FINAL' });

        // FECHAS OFICIALES FIFA 2026 (Hardcoded para precisión)
        const DATES = {
            R32_START: new Date('2026-06-28T16:00:00Z'),
            R16_START: new Date('2026-07-04T16:00:00Z'),
            QF_START: new Date('2026-07-09T16:00:00Z'),
            SEMI_1: new Date('2026-07-14T20:00:00Z'),
            SEMI_2: new Date('2026-07-15T20:00:00Z'),
            THIRD: new Date('2026-07-18T20:00:00Z'),
            FINAL: new Date('2026-07-19T20:00:00Z')
        };

        // 1. ROUND_32 (16 partidos) - Del 28 Jun al 3 Jul
        // Distribución: 3, 3, 3, 3, 2, 2
        const groupMapping = [
            { h: '1A', a: '3RD-1' }, { h: '1B', a: '3RD-2' }, { h: '1C', a: '3RD-3' }, { h: '1D', a: '3RD-4' },
            { h: '1E', a: '3RD-5' }, { h: '1F', a: '3RD-6' }, { h: '1G', a: '3RD-7' }, { h: '1H', a: '3RD-8' },
            { h: '1I', a: '2A' }, { h: '1J', a: '2B' }, { h: '1K', a: '2C' }, { h: '1L', a: '2D' },
            { h: '2E', a: '2F' }, { h: '2G', a: '2H' }, { h: '2I', a: '2J' }, { h: '2K', a: '2L' }
        ];

        const r32 = [];
        // Cronograma Oficial Dieciseisavos 2026:
        // Junio 28: 1 Partido (Partido 73)
        // Junio 29: 3 Partidos (Partidos 74-76)
        // Junio 30: 3 Partidos (Partidos 77-79)
        // Julio 1: 3 Partidos (Partidos 80-82)
        // Julio 2: 3 Partidos (Partidos 83-85)
        // Julio 3: 3 Partidos (Partidos 86-88)

        const r32Dates = [
            '2026-06-28T16:00:00Z', // M73
            '2026-06-29T16:00:00Z', '2026-06-29T19:00:00Z', '2026-06-29T22:00:00Z', // M74-76
            '2026-06-30T16:00:00Z', '2026-06-30T19:00:00Z', '2026-06-30T22:00:00Z', // M77-79
            '2026-07-01T16:00:00Z', '2026-07-01T19:00:00Z', '2026-07-01T22:00:00Z', // M80-82
            '2026-07-02T16:00:00Z', '2026-07-02T19:00:00Z', '2026-07-02T22:00:00Z', // M83-85
            '2026-07-03T16:00:00Z', '2026-07-03T19:00:00Z', '2026-07-03T22:00:00Z', // M86-88
        ];

        for (let i = 1; i <= 16; i++) {
            r32.push(this.matchesRepository.create({
                phase: 'ROUND_32', bracketId: i, status: 'PENDING', homeTeam: '', awayTeam: '',
                homeTeamPlaceholder: groupMapping[i - 1].h, awayTeamPlaceholder: groupMapping[i - 1].a,
                date: new Date(r32Dates[i - 1])
            }));
        }
        const saved32 = await this.matchesRepository.save(r32);

        // 2. ROUND_16 (8 partidos) - Del 4 Jul al 7 Jul (2 por día)
        const r16 = [];
        let r16Date = new Date(DATES.R16_START);
        for (let i = 1; i <= 8; i++) {
            r16.push(this.matchesRepository.create({
                phase: 'ROUND_16', bracketId: i, status: 'PENDING', homeTeam: '', awayTeam: '',
                homeTeamPlaceholder: `W32-${(i * 2) - 1}`, awayTeamPlaceholder: `W32-${i * 2}`,
                date: new Date(r16Date)
            }));
            if (i % 2 === 0) r16Date.setDate(r16Date.getDate() + 1);
        }
        const saved16 = await this.matchesRepository.save(r16);

        // 3. QUARTER (4 partidos) - 9, 10, 11 Jul
        const qf = [];
        qf.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-1', awayTeamPlaceholder: 'W16-2', date: new Date('2026-07-09T20:00:00Z') }));
        qf.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 2, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-3', awayTeamPlaceholder: 'W16-4', date: new Date('2026-07-10T20:00:00Z') }));
        qf.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 3, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-5', awayTeamPlaceholder: 'W16-6', date: new Date('2026-07-11T16:00:00Z') }));
        qf.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 4, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-7', awayTeamPlaceholder: 'W16-8', date: new Date('2026-07-11T20:00:00Z') }));
        const savedQF = await this.matchesRepository.save(qf);

        // 4. SEMI (2 partidos) - 14 y 15 Jul
        const sf = [];
        sf.push(this.matchesRepository.create({ phase: 'SEMI', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'WQF-1', awayTeamPlaceholder: 'WQF-2', date: DATES.SEMI_1 }));
        sf.push(this.matchesRepository.create({ phase: 'SEMI', bracketId: 2, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'WQF-3', awayTeamPlaceholder: 'WQF-4', date: DATES.SEMI_2 }));
        const savedSF = await this.matchesRepository.save(sf);

        // 5. FINAL (19 Jul) - bracketId 1
        const f = await this.matchesRepository.save(this.matchesRepository.create({
            phase: 'FINAL', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD',
            homeTeamPlaceholder: 'WSF-1', awayTeamPlaceholder: 'WSF-2',
            date: DATES.FINAL
        }));

        // 6. 3RD PLACE (18 Jul) - bracketId 1
        const tp = await this.matchesRepository.save(this.matchesRepository.create({
            phase: '3RD_PLACE', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD',
            homeTeamPlaceholder: 'LSF-1', awayTeamPlaceholder: 'LSF-2',
            date: DATES.THIRD
        }));

        // CONEXIONES
        for (let i = 0; i < 16; i++) { saved32[i].nextMatchId = saved16[Math.floor(i / 2)].id; await this.matchesRepository.save(saved32[i]); }
        for (let i = 0; i < 8; i++) { saved16[i].nextMatchId = savedQF[Math.floor(i / 2)].id; await this.matchesRepository.save(saved16[i]); }
        for (let i = 0; i < 4; i++) { savedQF[i].nextMatchId = savedSF[Math.floor(i / 2)].id; await this.matchesRepository.save(savedQF[i]); }
        for (let i = 0; i < 2; i++) { savedSF[i].nextMatchId = f.id; await this.matchesRepository.save(savedSF[i]); }

        return { message: 'Tournament Keys 2026 Seeded (Correct Dates + 3rd Place)', created: 32 };
    }


    async promoteAllGroups(): Promise<void> {
        return this.tournamentService.promoteAllCompletedGroups();
    }


    async simulateResults(phase?: string, tid: string = 'WC2026'): Promise<{ message: string; updated: number }> {
        try {
            // Determinamos qué fase simular
            let targetPhase = phase;

            if (!targetPhase) {
                // Si no se especifica, buscamos la primera fase desbloqueada PARA ESTE TORNEO que tenga partidos pendientes
                const unlockedPhases = await this.phaseStatusRepository.find({
                    where: { 
                        isUnlocked: true, 
                        allMatchesCompleted: false,
                        tournamentId: tid // 🔥 Critical fix: filter by tournament using tid
                    }
                });

                // Orden real de las fases (Merged order is OK, filtering handles isolation)
                const phaseOrder = tid === 'UCL2526' 
                    ? ['PLAYOFF', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL']
                    : ['GROUP', 'ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
                    
                const sortedUnlocked = unlockedPhases.sort((a, b) => phaseOrder.indexOf(a.phase) - phaseOrder.indexOf(b.phase));

                if (sortedUnlocked.length > 0) {
                    targetPhase = sortedUnlocked[0].phase;
                } else {
                    targetPhase = tid === 'UCL2526' ? 'PLAYOFF' : 'GROUP'; // Default
                }
            }

            console.log(`🤖 [SIMULATOR] Iniciando simulación para fase: ${targetPhase} (${tid})`);

            // NEW: Ensure integrity of tournament structure before anything
            const integrityCheck = await this.ensureTournamentIntegrity();
            if (integrityCheck.repaired) {
                 // If structure was repaired, we must re-sync any pending promotions
                 console.log('🔄 [SIMULATOR] Integrity repair detected. Re-running promotions to fill new slots...');
                 await this.tournamentService.promotePhaseWinners('ROUND_16');
                 await this.tournamentService.promotePhaseWinners('QUARTER');
                 await this.tournamentService.promotePhaseWinners('SEMI');
            }

            // SELF-HEALING: Antes de simular, aseguramos que la fase anterior haya propagado sus ganadores.
            // Esto corrige situaciones donde la fase N está vacía a pesar de que N-1 terminó.
            if (targetPhase !== 'GROUP' && targetPhase !== 'PLAYOFF') {
                 const phaseOrder = tid === 'UCL2526' 
                    ? ['PLAYOFF', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL']
                    : ['GROUP', 'ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
                    
                 const prevIndex = phaseOrder.indexOf(targetPhase) - 1;
                 if (prevIndex >= 0) {
                     const prevPhase = phaseOrder[prevIndex];
                     console.log(`🚑 [SELF-HEALING] Verificando propagación desde ${prevPhase}...`);
                     if (prevPhase === 'GROUP') {
                         await this.tournamentService.promoteAllCompletedGroups();
                     } else {
                         await this.tournamentService.promotePhaseWinners(prevPhase);
                     }
                 }
            }

            // Obtenemos partidos de esa fase que no estén finalizados y sean del torneo correcto
            const matches = await this.matchesRepository.find({
                where: {
                    phase: targetPhase,
                    tournamentId: tid, // 🔥 Filter by tournament using tid
                    status: In(['PENDING', 'NS', 'LIVE', 'IN_PROGRESS', 'NOT_STARTED', 'SCHEDULED'])
                }
            });

            console.log(`🤖 [SIMULATOR] Encontrados ${matches.length} partidos pendientes en fase ${targetPhase}`);

            let updatedCount = 0;

            for (const match of matches) {
                // Solo simular si tiene equipos definidos (no placeholders vacíos)
                // Nota: En knockout, los placeholders como '1A' cuentan como homeTeam en la DB si el seeder fue así
                // pero para simular necesitamos que tengan equipos reales o que el usuario quiera simular placeholders
                if (match.homeTeam && match.awayTeam) {
                    const generateScore = () => {
                        const r = Math.random();
                        if (r < 0.2) return 0;
                        if (r < 0.5) return 1;
                        if (r < 0.8) return 2;
                        if (r < 0.95) return 3;
                        return 4;
                    };

                    let homeScore = generateScore();
                    let awayScore = generateScore();

                    // En fases eliminatorias, NO permitimos empates en la simulación para que el torneo avance
                    if (targetPhase !== 'GROUP' && homeScore === awayScore) {
                        // Desempatar al azar
                        if (Math.random() > 0.5) homeScore++;
                        else awayScore++;
                    }

                    const updatedMatch = await this.matchesRepository.save({
                        ...match,
                        homeScore,
                        awayScore,
                        status: 'FINISHED',
                        isManuallyLocked: true
                    });
                    
                    // Trigger Points Calculation (Ensure scores are updated)
                    if (this['scoringService']) {
                         await this['scoringService'].calculatePointsForMatch(updatedMatch.id);
                    }

                    // Determine Winner for Bracket Points
                    const winner = homeScore > awayScore ? match.homeTeam : match.awayTeam;
                    
                    // Trigger Bracket Points Calculation
                    if (this.bracketsService) {
                        await this.bracketsService.calculateBracketPoints(updatedMatch.id, winner);
                    }

                    // Trigger Promotion (Critical Step Added)
                    if (targetPhase !== 'GROUP') {
                         await this.tournamentService.promoteToNextRound(updatedMatch);
                    }

                    updatedCount++;

                    if (updatedCount % 10 === 0) {
                        console.log(`🤖 [SIMULATOR] Progreso: ${updatedCount}/${matches.length} partidos procesados...`);
                    }
                }
            }

            // CRITICAL: After simulation loop, check if phase is complete and UNLOCK NEXT PHASE
            const tournamentId = matches.length > 0 ? matches[0].tournamentId : 'WC2026'; // Default to WC2026 if no matches found
            const isPhaseComplete = await this.knockoutPhasesService.areAllMatchesCompleted(targetPhase, tournamentId);
            if (isPhaseComplete) {
                console.log(`✅ Phase ${targetPhase} simulation complete. Promoting and Unlocking next phase...`);
                
                // 1. If it was GROUP phase, promote all groups to R32
                if (targetPhase === 'GROUP') {
                    await this.tournamentService.promoteAllCompletedGroups();
                } else {
                    // For Knockout phases, ensure batch promotion runs to catch any missed updates
                    await this.tournamentService.promotePhaseWinners(targetPhase);
                }

                // 2. Unlock the next phase status so it becomes visible
                await this.knockoutPhasesService.checkAndUnlockNextPhase(targetPhase, tournamentId);
            }

            return {
                message: `Simulación de ${targetPhase} completada: ${updatedCount} partidos finalizados.`,
                updated: updatedCount
            };

        } catch (error) {
            console.error(`❌ [SIMULATOR ERROR] Error simulando resultados para fase ${phase}:`, error);
            try {
                fs.writeFileSync('sim_error.log', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            } catch (e) { console.error('Log write failed', e); }
            throw error;
        }
    }

    async resetAllMatches(): Promise<{ message: string; reset: number }> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Limpiar todos los partidos
            const matches = await this.matchesRepository.find();
            for (const match of matches) {
                match.homeScore = null;
                match.awayScore = null;
                match.status = 'PENDING';
                match.isManuallyLocked = false;

                // CRÍTICO: Solo limpiar equipos si NO es fase de grupos.
                if (match.phase !== 'GROUP' && (match.homeTeamPlaceholder || match.awayTeamPlaceholder)) {
                    match.homeTeam = '';
                    match.awayTeam = '';
                    match.homeFlag = null as any;
                    match.awayFlag = null as any;
                }
                await queryRunner.manager.save(match);
            }

            // 2. Resetear todas las predicciones a 0 puntos
            await queryRunner.manager.createQueryBuilder()
                .update(Prediction)
                .set({ points: 0 })
                .execute();

            // 3. Resetear puntos de participantes
            await queryRunner.manager.createQueryBuilder()
                .update(LeagueParticipant)
                .set({
                    totalPoints: 0,
                    currentRank: null as any,
                    triviaPoints: 0,
                    tieBreakerGuess: null as any
                })
                .execute();

            // 4. Limpiar Brackets
            await queryRunner.manager.createQueryBuilder()
                .update(UserBracket)
                .set({ points: 0 })
                .execute();

            // 5. Resetear estados de fases eliminatorias
            await queryRunner.manager.createQueryBuilder()
                .update(KnockoutPhaseStatus)
                .set({
                    isUnlocked: false,
                    allMatchesCompleted: false,
                    unlockedAt: null as any
                })
                .execute();

            await queryRunner.manager.createQueryBuilder()
                .update(KnockoutPhaseStatus)
                .set({ isUnlocked: true })
                .where("phase = :p", { p: 'GROUP' })
                .execute();

            await queryRunner.commitTransaction();

            return {
                message: `Sistema reiniciado correctamente: ${matches.length} partidos limpios.`,
                reset: matches.length
            };
        } catch (error) {
            console.error("❌ Error profundo en resetAllMatches:", error);
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
    async diagnoseAndFixSchedule() {
        // Find ALL Group Matches on or after June 28 (Start of R32)
        const badGroupMatches = await this.matchesRepository.createQueryBuilder('m')
            .where("m.phase = 'GROUP'")
            .andWhere("m.date >= '2026-06-28'")
            .getMany();
            
        console.log(`Found ${badGroupMatches.length} misplaced group matches.`);
        
        // Fix: Move them to June 11 (Opening day default) 
        // This clears the schedule for the Knockout Phase.
        for (const m of badGroupMatches) {
            m.date = new Date('2026-06-11T16:00:00Z');
            await this.matchesRepository.save(m);
        }
        
        return { fixed: badGroupMatches.length, matches: badGroupMatches.map(m => `${m.id}: ${m.homeTeam}-${m.awayTeam} (${m.date})`) };
    }

    /**
     * Checks if all knockout phases exist and have correct match counts.
     * If not, it recreates the missing phases and heals the links.
     * This is an IDEMPOTENT operation safe to run multiple times.
     */
    async ensureTournamentIntegrity() {
        console.log('🛡️ [INTEGRITY] Checking Tournament Structure...');

        const qfCount = await this.matchesRepository.count({ where: { phase: 'QUARTER' } });
        
        if (qfCount < 4) {
             console.log('🚨 [INTEGRITY] DETECTED MISSING PHASES (QF+). Initiating Auto-Repair...');
             
             const DATES = {
                SEMI_1: new Date('2026-07-14T20:00:00Z'),
                SEMI_2: new Date('2026-07-15T20:00:00Z'),
                THIRD: new Date('2026-07-18T20:00:00Z'),
                FINAL: new Date('2026-07-19T20:00:00Z')
             };
             
             // 0. SAFETY: Unlink Foreign Keys (nextMatchId) before deletion to prevent crashes
             console.log('🧹 [INTEGRITY] Unlinking FK references...');
             const phasesToDelete = ['QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
             
             // Find all matches that point to matches in the deletion zone and nullify link
             const matchesToDelete = await this.matchesRepository.find({ where: { phase: In(phasesToDelete) }, select: ['id'] });
             const idsToDelete = matchesToDelete.map(m => m.id);
             
             if (idsToDelete.length > 0) {
                 await this.matchesRepository.createQueryBuilder()
                     .update(Match)
                     .set({ nextMatchId: null as any })
                     .where("nextMatchId IN (:...ids)", { ids: idsToDelete })
                     .execute();
             }

             // 1. Clean potentially corrupted partial phases
             await this.matchesRepository.delete({ phase: In(phasesToDelete) });
             
             // 2. Create QUARTERS (Empty slots)
             const newQF = [];
             newQF.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-1', awayTeamPlaceholder: 'W16-2', date: new Date('2026-07-09T20:00:00Z') }));
             newQF.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 2, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-3', awayTeamPlaceholder: 'W16-4', date: new Date('2026-07-10T20:00:00Z') }));
             newQF.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 3, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-5', awayTeamPlaceholder: 'W16-6', date: new Date('2026-07-11T20:00:00Z') }));
             newQF.push(this.matchesRepository.create({ phase: 'QUARTER', bracketId: 4, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'W16-7', awayTeamPlaceholder: 'W16-8', date: new Date('2026-07-11T20:00:00Z') }));
             const savedQF = await this.matchesRepository.save(newQF);
             
             // 3. Create SEMIS
             const newSF = [];
             newSF.push(this.matchesRepository.create({ phase: 'SEMI', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'WQF-1', awayTeamPlaceholder: 'WQF-2', date: DATES.SEMI_1 }));
             newSF.push(this.matchesRepository.create({ phase: 'SEMI', bracketId: 2, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', homeTeamPlaceholder: 'WQF-3', awayTeamPlaceholder: 'WQF-4', date: DATES.SEMI_2 }));
             const savedSF = await this.matchesRepository.save(newSF);
             
             // 4. Create FINALS
             const f = await this.matchesRepository.save(this.matchesRepository.create({ phase: 'FINAL', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', date: DATES.FINAL, homeTeamPlaceholder: 'WSF-1', awayTeamPlaceholder: 'WSF-2' }));
             const tp = await this.matchesRepository.save(this.matchesRepository.create({ phase: '3RD_PLACE', bracketId: 1, status: 'PENDING', homeTeam: 'TBD', awayTeam: 'TBD', date: DATES.THIRD, homeTeamPlaceholder: 'LSF-1', awayTeamPlaceholder: 'LSF-2' }));
             
             // 5. LINKING (Re-establish the chain)
             // Relink future phases
             for (let i = 0; i < 2; i++) { savedSF[i].nextMatchId = f.id; await this.matchesRepository.save(savedSF[i]); }
             for (let i = 0; i < 4; i++) { savedQF[i].nextMatchId = savedSF[Math.floor(i / 2)].id; await this.matchesRepository.save(savedQF[i]); }
             
             // CRITICAL: Relink Existing R16 -> New QF
             const r16Matches = await this.matchesRepository.find({ where: { phase: 'ROUND_16' }, order: { bracketId: 'ASC' } });
             for (const m of r16Matches) {
                 if (m.bracketId) {
                     const targetQFIndex = Math.ceil(m.bracketId / 2) - 1; 
                     if (savedQF[targetQFIndex]) {
                         m.nextMatchId = savedQF[targetQFIndex].id;
                         await this.matchesRepository.save(m);
                     }
                 }
             }
             
             console.log('✅ [INTEGRITY] Missing phases created and linked.');
             return { repaired: true, message: 'Missing phases restored.' };
        }
        
        console.log('✅ [INTEGRITY] Structure appears healthy.');
        return { repaired: false, message: 'Structure OK.' };
    }

    async rebuildBrackets() {
        console.log('🔄 STARTING EMERGENCY BRACKET REBUILD');
        // 1. Resetear Bracket (Borrar y Crear placeholders limpios)
        await this.seedRound32();

        // 2. Promover Ganadores de Grupos
        const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
        for (const g of groups) {
            await this.tournamentService.promoteFromGroup(g);
        }

        // 3. Promover Terceros
        await this.tournamentService.promoteBestThirds();

        console.log('✅ EMERGENCY BRACKET REBUILD COMPLETE');
        return { message: 'Brackets Rebuilt Cleanly' };
    }

    async fixUCLMatchData() {
        console.log('🔧 [FIX] Running manual fix for UCL Matches tagged as WC2026...');
        const uclTeams = [
            'Manchester City', 'Juventus',
            'Real Madrid', 'Benfica',
            'Liverpool', 'AC Milan',
            'Arsenal', 'PSV',
            'Atletico Madrid', 'Club Brugge',
            'Inter Milan', 'Bayer Leverkusen',
            'Bayern Munich', 'Sporting CP',
            'PSG', 'Feyenoord'
        ];

        // Method 1: Update by Home Team
        const res1 = await this.matchesRepository.createQueryBuilder()
            .update(Match)
            .set({ tournamentId: 'UCL2526' })
            .where("homeTeam IN (:...teams)", { teams: uclTeams })
            .andWhere("tournamentId = 'WC2026'")
            .execute();

        // Method 2: Update by Away Team
        const res2 = await this.matchesRepository.createQueryBuilder()
            .update(Match)
            .set({ tournamentId: 'UCL2526' })
            .where("awayTeam IN (:...teams)", { teams: uclTeams })
            .andWhere("tournamentId = 'WC2026'")
            .execute();

        const total = (res1.affected || 0) + (res2.affected || 0);
        console.log(`✅ [FIX] Updated ${total} UCL matches found in WC2026.`);
        
        return { message: `Corregidos ${total} partidos de Champions que estaban en Mundial`, updated: total };
    }

    async fixEmptyTeamFields() {
        console.log('🔧 [FIX] Fixing empty team fields in knockout matches...');
        const knockoutPhases = ['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL', '3RD_PLACE'];
        let totalFixed = 0;
        
        for (const phase of knockoutPhases) {
            const result = await this.matchesRepository
                .createQueryBuilder()
                .update(Match)
                .set({ 
                    homeTeam: 'TBD',
                    awayTeam: 'TBD'
                })
                .where("phase = :phase", { phase })
                .andWhere("(homeTeam IS NULL OR homeTeam = '' OR awayTeam IS NULL OR awayTeam = '')")
                .execute();
            
            totalFixed += result.affected || 0;
            console.log(`✅ [FIX] Fixed ${result.affected || 0} matches in ${phase}`);
        }
        
        console.log(`✅ [FIX] Total matches fixed: ${totalFixed}`);
        return { message: 'Fixed empty team fields', totalFixed, phases: knockoutPhases };
    }

    // --- ADMIN TEAM MANAGEMENT ---

    async setTeams(matchId: string, homeCode: string, awayCode: string) {
        // Dynamic import based on migration
        const { getTeamInfo } = require('../common/teams-dictionary');

        const match = await this.matchesRepository.findOneBy({ id: matchId });
        if (!match) throw new NotFoundException('Match not found');

        if (homeCode) {
            const home = getTeamInfo(homeCode);
            match.homeTeam = home.name;
            match.homeFlag = home.flag;
            match.homeTeamPlaceholder = null;
        }

        if (awayCode) {
            const away = getTeamInfo(awayCode);
            match.awayTeam = away.name;
            match.awayFlag = away.flag;
            match.awayTeamPlaceholder = null;
        }
        
        // If both teams are set, we can enable the match
        if (match.homeTeam && match.awayTeam) {
            match.status = 'PENDING';
        }

        const savedMatch = await this.matchesRepository.save(match);

        // 🤖 Emit event for AI prediction generation
        if (match.homeTeam && match.awayTeam) {
            this.eventEmitter.emit('match.teams.assigned', {
                matchId: savedMatch.id,
                homeTeam: savedMatch.homeTeam,
                awayTeam: savedMatch.awayTeam,
            });
            console.log(`⚡ Event 'match.teams.assigned' emitted for ${savedMatch.homeTeam} vs ${savedMatch.awayTeam}`);
        }

        return savedMatch;
    }

    async renameTeam(oldName: string, newCode: string) {
        const { getTeamInfo } = require('../common/teams-dictionary');
        const newTeam = getTeamInfo(newCode);
        
        // Update as Home Team
        await this.matchesRepository.createQueryBuilder()
            .update(Match)
            .set({ homeTeam: newTeam.name, homeFlag: newTeam.flag })
            .where("homeTeam = :oldName", { oldName })
            .execute();

        // Update as Away Team
        await this.matchesRepository.createQueryBuilder()
            .update(Match)
            .set({ awayTeam: newTeam.name, awayFlag: newTeam.flag })
            .where("awayTeam = :oldName", { oldName })
            .execute();

        return { success: true, oldName, newTeam };
    }

    /**
     * Set manual lock for a match (Admin Kill Switch)
     * @param matchId Match ID
     * @param locked true to lock, false to unlock
     */
    async setManualLock(matchId: string, locked: boolean) {
        const match = await this.matchesRepository.findOne({ where: { id: matchId } });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        match.isManuallyLocked = locked;
        await this.matchesRepository.save(match);

        return {
            message: `Match ${locked ? 'locked 🔒' : 'unlocked 🔓'} successfully`,
            matchId,
            isManuallyLocked: locked,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam
        };
    }

    /**
     * Set manual lock for an entire knockout phase
     * @param phase Phase name (ROUND_32, ROUND_16, QUARTER, SEMI, 3RD_PLACE, FINAL)
     * @param locked true to lock, false to unlock
     */
    async setPhaseLock(phase: string, locked: boolean, tournamentId: string = 'WC2026') {
        const validPhases = ['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
        
        if (!validPhases.includes(phase)) {
            throw new NotFoundException(`Invalid phase: ${phase}. Valid phases: ${validPhases.join(', ')}`);
        }

        // Find or create phase status
        let phaseStatus = await this.phaseStatusRepository.findOne({ where: { phase, tournamentId } });

        if (!phaseStatus) {
            phaseStatus = this.phaseStatusRepository.create({
                phase,
                tournamentId,
                isManuallyLocked: locked,
                isUnlocked: false,
                allMatchesCompleted: false,
            });
        } else {
            phaseStatus.isManuallyLocked = locked;
        }

        await this.phaseStatusRepository.save(phaseStatus);

        return {
            message: `Phase ${phase} ${locked ? 'locked 🔒' : 'unlocked 🔓'} successfully`,
            phase,
            isManuallyLocked: locked,
        };
    }

    /**
     * Get status of all knockout phases
     */
    async getAllPhaseStatus(tournamentId: string = 'WC2026') {
        const phases = ['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
        
        // Ensure we filter by tournamentId
        const statuses = await this.phaseStatusRepository.find({ where: { tournamentId } });

        // Create a map for easy lookup
        const statusMap = new Map(statuses.map(s => [s.phase, s]));

        // Return all phases with their status (or default if not found)
        return phases.map(phase => {
            const status = statusMap.get(phase);
            return {
                phase,
                isManuallyLocked: status?.isManuallyLocked || false,
                isUnlocked: status?.isUnlocked || false,
                allMatchesCompleted: status?.allMatchesCompleted || false,
                tournamentId
            };
        });
    }
}


