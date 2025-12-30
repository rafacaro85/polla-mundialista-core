import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ScoringService } from '../scoring/scoring.service';
import { BracketsService } from '../brackets/brackets.service';
import { TournamentService } from '../tournament/tournament.service';
import { KnockoutPhasesService } from '../knockout-phases/knockout-phases.service';

@Injectable()
export class MatchesService {
    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        @InjectRepository(Prediction)
        private predictionsRepository: Repository<Prediction>,
        private scoringService: ScoringService,
        private dataSource: DataSource,
        private bracketsService: BracketsService,
        private tournamentService: TournamentService,
        private knockoutPhasesService: KnockoutPhasesService,
    ) { }

    async findAll(userId?: string): Promise<Match[]> {
        const query = this.matchesRepository.createQueryBuilder('match')
            .leftJoinAndSelect('match.predictions', 'prediction', 'prediction.userId = :userId', { userId })
            .orderBy('match.date', 'ASC');

        return query.getMany();
    }

    async findLive(): Promise<Match[]> {
        return this.matchesRepository.find({
            order: { date: 'ASC' }
        });
    }



    async createMatch(data: {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        externalId?: number;
    }): Promise<Match> {
        const newMatch = this.matchesRepository.create({
            ...data,
            homeScore: 0,
            awayScore: 0,
            status: 'NS', // Not Started
            isLocked: false,
        });
        return this.matchesRepository.save(newMatch);
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
                await this.knockoutPhasesService.checkAndUnlockNextPhase(match.phase);
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
        if (data.date !== undefined) match.date = data.date;
        if (data.bracketId !== undefined) match.bracketId = data.bracketId;
        if (data.nextMatchId !== undefined) match.nextMatchId = data.nextMatchId;
        if (data.isLocked !== undefined) match.isLocked = data.isLocked;

        const savedMatch = await this.matchesRepository.save(match);

        // 🔥 CRITICAL: Recalculate prediction points if match just finished
        if (wasNotFinished && match.status === 'FINISHED' &&
            match.homeScore !== null && match.awayScore !== null) {

            // Recalcular puntos para todas las predicciones
            const predictionsToUpdate: Prediction[] = [];

            if (match.predictions) {
                for (const prediction of match.predictions) {
                    const points = this.scoringService.calculatePoints(match, prediction);
                    prediction.points = points;
                    predictionsToUpdate.push(prediction);
                }
            }

            // Guardar predicciones actualizadas
            if (predictionsToUpdate.length > 0) {
                await this.predictionsRepository.save(predictionsToUpdate);
                console.log(`✅ Recalculated points for ${predictionsToUpdate.length} predictions in match ${id}`);
            }

            // Calculate bracket points
            const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
            await this.bracketsService.calculateBracketPoints(id, winner);
            console.log(`🏆 Bracket points calculated for match ${id}, winner: ${winner}`);

            // Check and unlock next knockout phase if current phase is complete
            if (match.phase) {
                await this.knockoutPhasesService.checkAndUnlockNextPhase(match.phase);
                console.log(`🔓 Checked phase unlock for ${match.phase}`);
            }

            // Trigger automático de promoción si es partido de grupo
            if (match.phase === 'GROUP' && match.group) {
                this.tournamentService.promoteFromGroup(match.group)
                    .catch(err => console.error(`❌ Error promoting from group ${match.group}:`, err));
            }

            // Trigger automático de promoción si es partido de Dieciseisavos (ROUND_32)
            if (match.phase === 'ROUND_32' && match.nextMatchId) {
                const nextMatch = await this.matchesRepository.findOne({ where: { id: match.nextMatchId } });
                if (nextMatch) {
                    const isHome = (match.bracketId % 2) !== 0;
                    const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
                    const winnerFlag = match.homeScore > match.awayScore ? match.homeFlag : match.awayFlag;

                    if (isHome) {
                        nextMatch.homeTeam = winner;
                        nextMatch.homeFlag = winnerFlag;
                        nextMatch.homeTeamPlaceholder = null;
                    } else {
                        nextMatch.awayTeam = winner;
                        nextMatch.awayFlag = winnerFlag;
                        nextMatch.awayTeamPlaceholder = null;
                    }
                    await this.matchesRepository.save(nextMatch);
                    console.log(`➡️ Promocionado ${winner} al partido ${nextMatch.id} (Octavos)`);
                }
            }
        }

        return savedMatch;
    }

    async seedRound32(): Promise<{ message: string; created: number }> {
        // Eliminar si ya existen para evitar duplicados
        await this.matchesRepository.delete({ phase: 'ROUND_32' });
        await this.matchesRepository.delete({ phase: 'ROUND_16' });

        const baseDate = new Date('2026-06-28T16:00:00Z');

        // 1. Crear 16 partidos de ROUND_32
        const r32Matches = [];
        const groupMapping = [
            { h: '1A', a: '3CDE' }, { h: '1B', a: '3FGH' }, { h: '1C', a: '2D' }, { h: '1D', a: '2C' },
            { h: '1E', a: '3IJK' }, { h: '1F', a: '2E' }, { h: '1G', a: '2F' }, { h: '1H', a: '2G' },
            { h: '1I', a: '3ABL' }, { h: '1J', a: '2I' }, { h: '1K', a: '2J' }, { h: '1L', a: '2K' },
            { h: '2A', a: '2B' }, { h: '2H', a: '2L' }, { h: '2G', a: '2K' }, { h: '2F', a: '2J' }
        ];

        for (let i = 1; i <= 16; i++) {
            const date = new Date(baseDate.getTime() + (Math.floor((i - 1) / 4)) * 24 * 60 * 60 * 1000);
            const mapping = groupMapping[i - 1];
            r32Matches.push(this.matchesRepository.create({
                phase: 'ROUND_32',
                bracketId: i,
                date,
                homeTeam: '',
                awayTeam: '',
                homeTeamPlaceholder: mapping.h,
                awayTeamPlaceholder: mapping.a,
                status: 'PENDING',
            }));
        }
        const savedR32 = await this.matchesRepository.save(r32Matches);

        // 2. Crear 8 partidos de ROUND_16
        const r16Matches = [];
        for (let i = 1; i <= 8; i++) {
            r16Matches.push(this.matchesRepository.create({
                phase: 'ROUND_16',
                bracketId: i,
                date: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
                homeTeam: '',
                awayTeam: '',
                homeTeamPlaceholder: `W32-${(i * 2) - 1}`,
                awayTeamPlaceholder: `W32-${i * 2}`,
                status: 'PENDING',
            }));
        }
        const savedR16 = await this.matchesRepository.save(r16Matches);

        // 3. Conectar R32 -> R16
        for (let i = 0; i < 16; i++) {
            const nextIdx = Math.floor(i / 2);
            savedR32[i].nextMatchId = savedR16[nextIdx].id;
            await this.matchesRepository.save(savedR32[i]);
        }

        return { message: 'Round of 32 and Round of 16 seeded and connected', created: savedR32.length + savedR16.length };
    }


    async promoteAllGroups(): Promise<void> {
        return this.tournamentService.promoteAllCompletedGroups();
    }


    async simulateResults(): Promise<{ message: string; updated: number }> {
        // Obtenemos partidos que tienen equipos y no están finalizados
        const matches = await this.matchesRepository.find();
        let updatedCount = 0;

        for (const match of matches) {
            // Solo simular si tiene equipos y no está finalizado
            if (match.homeTeam && match.awayTeam && match.status !== 'FINISHED') {
                // Resultados realistas (promedio de goles en mundial es ~2.5)
                // Usamos una distribución que favorezca 0, 1, 2 goles
                const generateScore = () => {
                    const r = Math.random();
                    if (r < 0.2) return 0;
                    if (r < 0.5) return 1;
                    if (r < 0.8) return 2;
                    if (r < 0.95) return 3;
                    return 4;
                };

                const homeScore = generateScore();
                const awayScore = generateScore();

                // Intentar evitar empates en fases eliminatorias si es necesario, 
                // pero updateMatch maneja lo básico.

                await this.updateMatch(match.id, {
                    homeScore,
                    awayScore,
                    status: 'FINISHED',
                    isLocked: true
                });
                updatedCount++;
            }
        }

        return {
            message: `Simulación completada: ${updatedCount} partidos finalizados con resultados realistas.`,
            updated: updatedCount
        };
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
                match.isLocked = false;

                // Si es un partido de fase eliminatoria (tiene placeholder), limpiar equipos
                if (match.homeTeamPlaceholder || match.awayTeamPlaceholder) {
                    match.homeTeam = '';
                    match.awayTeam = '';
                }
                await queryRunner.manager.save(match);
            }

            // 2. Resetear puntos de predicciones
            await queryRunner.manager.update('predictions', {}, { points: 0 });

            // 3. Resetear puntos de participantes en todas las ligas
            await queryRunner.manager.update('league_participants', {}, { totalPoints: 0, currentRank: null, triviaPoints: 0 });

            await queryRunner.commitTransaction();

            return {
                message: `Sistema reiniciado: ${matches.length} partidos limpios y puntuaciones en cero.`,
                reset: matches.length
            };
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
