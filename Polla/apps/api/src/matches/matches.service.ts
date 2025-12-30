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
                // Lógica de promoción para llaves de eliminación directa
                const nextMatch = await this.matchesRepository.findOne({ where: { id: match.nextMatchId } });
                if (nextMatch) {
                    const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
                    const winnerFlag = match.homeScore > match.awayScore ? match.homeFlag : match.awayFlag;

                    // El match.bracketId nos dice si entra por arriba o por abajo del siguiente partido
                    // Usualmente, bracketId impar es home, par es away del siguiente
                    if ((match.bracketId % 2) !== 0) {
                        nextMatch.homeTeam = winner;
                        nextMatch.homeFlag = winnerFlag;
                    } else {
                        nextMatch.awayTeam = winner;
                        nextMatch.awayFlag = winnerFlag;
                    }
                    await this.matchesRepository.save(nextMatch);
                    console.log(`➡️ Promocionado ${winner} al partido ${nextMatch.id} (Octavos)`);
                }
            }
        }

        return savedMatch;
    }

    async seedRound32(): Promise<{ message: string; created: number }> {
        const count = await this.matchesRepository.count({ where: { phase: 'ROUND_32' } });
        if (count > 0) return { message: 'ROUND_32 already seeded', created: 0 };

        const baseDate = new Date('2026-06-28T16:00:00Z');
        const matches = [];

        // Generar 16 partidos para Dieciseisavos
        for (let i = 1; i <= 16; i++) {
            const date = new Date(baseDate.getTime() + (Math.floor((i - 1) / 4)) * 24 * 60 * 60 * 1000);
            matches.push({
                phase: 'ROUND_32',
                bracketId: i,
                date,
                homeTeam: '',
                awayTeam: '',
                homeTeamPlaceholder: `Ganador ${i}`, // Simplificado para demo
                awayTeamPlaceholder: `Segundo ${i}`,
                status: 'PENDING',
            });
        }

        // Mapeo real de grupos para los primeros partidos
        const groupMapping = [
            { h: '1A', a: '3CDE' }, { h: '1B', a: '3FGH' }, { h: '1C', a: '2D' }, { h: '1D', a: '2C' },
            { h: '1E', a: '3IJK' }, { h: '1F', a: '2E' }, { h: '1G', a: '2F' }, { h: '1H', a: '2G' },
            { h: '1I', a: '3ABL' }, { h: '1J', a: '2I' }, { h: '1K', a: '2J' }, { h: '1L', a: '2K' },
            { h: '2A', a: '2B' }, { h: '2H', a: '2L' }, { h: '3...', a: '3...' }, { h: '3...', a: '3...' }
        ];

        for (let i = 0; i < 16; i++) {
            if (groupMapping[i]) {
                matches[i].homeTeamPlaceholder = groupMapping[i].h;
                matches[i].awayTeamPlaceholder = groupMapping[i].a;
            }
        }

        const saved = await this.matchesRepository.save(matches);

        // Crear Octavos (ROUND_16) y conectarlos
        const round16 = [];
        for (let i = 1; i <= 8; i++) {
            round16.push({
                phase: 'ROUND_16',
                bracketId: i,
                date: new Date(baseDate.getTime() + 6 * 24 * 60 * 60 * 1000),
                homeTeam: '',
                awayTeam: '',
                status: 'PENDING',
                homeTeamPlaceholder: `W32-${(i * 2) - 1}`,
                awayTeamPlaceholder: `W32-${i * 2}`
            });
        }
        const savedR16 = await this.matchesRepository.save(round16);

        // Conectar R32 con R16
        for (let i = 0; i < 16; i++) {
            const nextIdx = Math.floor(i / 2);
            saved[i].nextMatchId = savedR16[nextIdx].id;
            await this.matchesRepository.save(saved[i]);
        }

        return { message: 'Round of 32 seeded and connected', created: saved.length };
    }

    async seedKnockoutMatches(): Promise<{ message: string; created: number }> {
        // Verificar si ya existen partidos de octavos
        const existingKnockout = await this.matchesRepository.count({
            where: { phase: 'ROUND_16' },
        });

        if (existingKnockout > 0) {
            return {
                message: `Ya existen ${existingKnockout} partidos de octavos. No se crearon nuevos.`,
                created: 0,
            };
        }

        const baseDate = new Date('2026-07-01T16:00:00Z');

        const knockoutMatches = [
            { homeTeamPlaceholder: '1A', awayTeamPlaceholder: '2B', phase: 'ROUND_16', bracketId: 1, date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1C', awayTeamPlaceholder: '2D', phase: 'ROUND_16', bracketId: 2, date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1E', awayTeamPlaceholder: '2F', phase: 'ROUND_16', bracketId: 3, date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1G', awayTeamPlaceholder: '2H', phase: 'ROUND_16', bracketId: 4, date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1B', awayTeamPlaceholder: '2A', phase: 'ROUND_16', bracketId: 5, date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1D', awayTeamPlaceholder: '2C', phase: 'ROUND_16', bracketId: 6, date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1F', awayTeamPlaceholder: '2E', phase: 'ROUND_16', bracketId: 7, date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
            { homeTeamPlaceholder: '1H', awayTeamPlaceholder: '2G', phase: 'ROUND_16', bracketId: 8, date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000) },
        ];

        for (const matchData of knockoutMatches) {
            const match = this.matchesRepository.create({
                ...matchData,
                homeTeam: '',
                awayTeam: '',
                homeScore: null,
                awayScore: null,
                status: 'PENDING',
            });
            await this.matchesRepository.save(match);
        }

        return {
            message: `Se crearon ${knockoutMatches.length} partidos de octavos exitosamente.`,
            created: knockoutMatches.length,
        };
    }

    async resetKnockoutMatches(): Promise<{ message: string; reset: number }> {
        // Buscar todos los partidos de octavos
        const knockoutMatches = await this.matchesRepository.find({
            where: { phase: 'ROUND_16' },
        });

        if (knockoutMatches.length === 0) {
            return {
                message: 'No hay partidos de octavos para resetear.',
                reset: 0,
            };
        }

        // Mapeo de placeholders según bracketId
        const placeholderMap: { [key: number]: { home: string; away: string } } = {
            1: { home: '1A', away: '2B' },
            2: { home: '1C', away: '2D' },
            3: { home: '1E', away: '2F' },
            4: { home: '1G', away: '2H' },
            5: { home: '1B', away: '2A' },
            6: { home: '1D', away: '2C' },
            7: { home: '1F', away: '2E' },
            8: { home: '1H', away: '2G' },
        };

        let resetCount = 0;

        for (const match of knockoutMatches) {
            const bracketId = match.bracketId || 0;
            const placeholders = placeholderMap[bracketId];

            if (placeholders) {
                match.homeTeam = '';
                match.awayTeam = '';
                match.homeTeamPlaceholder = placeholders.home;
                match.awayTeamPlaceholder = placeholders.away;
                match.homeScore = null;
                match.awayScore = null;
                match.status = 'PENDING';
                await this.matchesRepository.save(match);
                resetCount++;
            }
        }

        return {
            message: `Se resetearon ${resetCount} partidos de octavos a sus placeholders originales.`,
            reset: resetCount,
        };
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
