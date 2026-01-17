import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';

import { BracketsService } from '../brackets/brackets.service';

@Injectable()
export class PredictionsService {
    constructor(
        @InjectRepository(Prediction)
        private predictionsRepository: Repository<Prediction>,
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        @InjectRepository(LeagueParticipant)
        private leagueParticipantRepository: Repository<LeagueParticipant>,
        private bracketsService: BracketsService,
    ) { }

    async upsertPrediction(userId: string, matchId: string, homeScore: number, awayScore: number, leagueId?: string, isJoker?: boolean): Promise<Prediction> {
        // 1. Check if user is blocked in the league (if leagueId is provided)
        if (leagueId) {
            const participant = await this.leagueParticipantRepository.findOne({
                where: {
                    user: { id: userId },
                    league: { id: leagueId },
                },
            });

            if (participant && participant.isBlocked) {
                throw new ForbiddenException('No puedes realizar predicciones porque estás bloqueado en esta liga.');
            }
        }

        const match = await this.matchesRepository.findOne({ where: { id: matchId } });

        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Check if match has started
        if (match.date < new Date()) {
            throw new BadRequestException('Cannot predict on a match that has already started');
        }

        // JOKER LOGIC: Only one joker per phase allowed PER LEAGUE context.
        // We must ensure that if we set a joker here, any other joker visible in this league (Global or Local) is disabled.
        if (isJoker) {
            // Find ALL active jokers for this user/phase that are visible in this league (Unique Joker Rule)
            const previousJokers = await this.predictionsRepository.createQueryBuilder('p')
                .leftJoinAndSelect('p.match', 'match')
                .where('p.userId = :userId', { userId })
                .andWhere('p.isJoker = :isJoker', { isJoker: true })
                .andWhere('match.phase = :phase', { phase: match.phase })
                .andWhere(leagueId ? '(p.leagueId = :leagueId OR p.leagueId IS NULL)' : 'p.leagueId IS NULL', { leagueId })
                .getMany();

            for (const joker of previousJokers) {
                // If it's a DIFFERENT match, we must deactivate the joker.
                if (joker.match.id !== matchId) {
                    
                    if (joker.leagueId === null && leagueId) {
                        // CASE: Disabling a GLOBAL Joker inside a Specific League.
                        // We cannot modify the global record directly (it would affect other leagues).
                        // Instead, we create a LOCAL OVERRIDE for that match with isJoker=false.
                        
                        // Check if an override already exists (unlikely if we just fetched jokers, but safe to check)
                        const existingOverride = await this.predictionsRepository.findOne({
                            where: { user: { id: userId }, match: { id: joker.match.id }, leagueId }
                        });

                        if (existingOverride) {
                            existingOverride.isJoker = false;
                            await this.predictionsRepository.save(existingOverride);
                        } else {
                            // Create new override copying values but disabling joker
                            const override = this.predictionsRepository.create({
                                user: { id: userId } as User,
                                match: { id: joker.match.id } as Match,
                                leagueId: leagueId,
                                homeScore: joker.homeScore,
                                awayScore: joker.awayScore,
                                isJoker: false // Disabled locally
                            });
                            await this.predictionsRepository.save(override);
                        }

                    } else {
                        // CASE: Local joker or Global context edit. Just update the record.
                        joker.isJoker = false;
                        await this.predictionsRepository.save(joker);
                    }
                }
            }
        }

        let prediction = await this.predictionsRepository.findOne({
            where: {
                user: { id: userId },
                match: { id: matchId },
                leagueId: leagueId ? leagueId : IsNull()
            },
        });

        if (prediction) {
            prediction.homeScore = homeScore;
            prediction.awayScore = awayScore;
            if (isJoker !== undefined) prediction.isJoker = isJoker;
        } else {
            prediction = this.predictionsRepository.create({
                user: { id: userId } as User,
                match: { id: matchId } as Match,
                leagueId: leagueId || undefined,
                homeScore,
                awayScore,
                isJoker: isJoker || false
            });
        }

        return this.predictionsRepository.save(prediction);
    }

    async findAllByUser(userId: string, leagueId?: string): Promise<Prediction[]> {
        // Strategy: Return Global Predictions + League Specific Predictions.
        // Frontend/Consumer should handle the override logic (using leagueId to distinguish).
        // Or we can do it here: If we find a specific one, we return it. If not, return global.

        // Actually, returning both is safer so frontend knows which is which.
        // Query: UserID matched implies ownership.
        // LeagueID: Either Match the specific league OR match NULL (Global).

        const qb = this.predictionsRepository.createQueryBuilder('prediction')
            .leftJoinAndSelect('prediction.match', 'match')
            .where('prediction.userId = :userId', { userId });

        if (leagueId && leagueId !== 'global') {
            // Get Specific League OR Global
            qb.andWhere('(prediction.leagueId = :leagueId OR prediction.leagueId IS NULL)', { leagueId });
        } else {
            // Get ONLY Global
            qb.andWhere('prediction.leagueId IS NULL');
        }

        return qb.getMany();
    }

    async removePrediction(userId: string, matchId: string, leagueId?: string) {
        const match = await this.matchesRepository.findOne({ where: { id: matchId } });
        if (!match) {
            throw new NotFoundException('Match not found');
        }

        // Check if match has started
        if (match.date < new Date()) {
            throw new BadRequestException('Cannot delete prediction for a match that has already started');
        }

        const prediction = await this.predictionsRepository.findOne({
            where: {
                user: { id: userId },
                match: { id: matchId },
                leagueId: leagueId ? leagueId : IsNull()
            },
        });

        if (prediction) {
            await this.predictionsRepository.remove(prediction);
        }

        return { message: 'Prediction deleted' };
    }

    async removeAllPredictions(userId: string, leagueId?: string) {
        // 1. Limpiar el Bracket (llaves eliminatorias)
        await this.bracketsService.clearBracket(userId, leagueId);
        console.log(`🧹 Bracket para usuario ${userId} y liga ${leagueId} limpiado.`);

        // 2. Limpiar predicciones de partidos (Scores)
        const where: any = { user: { id: userId } };
        where.leagueId = leagueId ? leagueId : IsNull();

        // Solo borrar partidos que no han empezado
        const predictions = await this.predictionsRepository.find({
            where,
            relations: ['match']
        });

        const toDelete = predictions.filter(p => !p.match.date || p.match.date > new Date());

        if (toDelete.length > 0) {
            await this.predictionsRepository.remove(toDelete);
        }

        return {
            message: `Sistema de predicciones reseteado: Bracket borrado y ${toDelete.length} marcadores eliminados.`,
            count: toDelete.length
        };
    }
}
