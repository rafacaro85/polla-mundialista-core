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

        // JOKER LOGIC: Only one joker per phase allowed PER LEAGUE
        if (isJoker) {
            const previousJokers = await this.predictionsRepository.find({
                where: {
                    user: { id: userId },
                    isJoker: true,
                    leagueId: leagueId ? leagueId : IsNull(),
                    match: { phase: match.phase }
                },
                relations: ['match']
            });

            for (const joker of previousJokers) {
                if (joker.match.id !== matchId) {
                    joker.isJoker = false;
                    await this.predictionsRepository.save(joker);
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

    async findAllByUser(userId: string): Promise<Prediction[]> {
        return this.predictionsRepository.find({
            where: { user: { id: userId } },
            relations: ['match'],
        });
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
