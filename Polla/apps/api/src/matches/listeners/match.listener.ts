
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../../database/entities/match.entity';
import { Prediction } from '../../database/entities/prediction.entity';
import { ScoringService } from '../../scoring/scoring.service';
import { BracketsService } from '../../brackets/brackets.service';
import { TournamentService } from '../../tournament/tournament.service';
import { KnockoutPhasesService } from '../../knockout-phases/knockout-phases.service';

export class MatchFinishedEvent {
    constructor(
        public readonly match: Match,
        public readonly homeScore: number,
        public readonly awayScore: number
    ) {}
}

@Injectable()
export class MatchListener {
    private readonly logger = new Logger(MatchListener.name);

    constructor(
        @InjectRepository(Match)
        private matchesRepository: Repository<Match>,
        @InjectRepository(Prediction)
        private predictionsRepository: Repository<Prediction>,
        private scoringService: ScoringService,
        private bracketsService: BracketsService,
        private tournamentService: TournamentService,
        private knockoutPhasesService: KnockoutPhasesService,
    ) {}

    @OnEvent('match.finished', { async: true })
    async handleMatchFinishedEvent(event: MatchFinishedEvent) {
        const { match, homeScore, awayScore } = event;
        const matchId = match.id;

        this.logger.log(`⚡ Async processing for finished match ${matchId} (Home: ${homeScore} - Away: ${awayScore})`);

        try {
            // 1. Recalcular puntos para todas las predicciones
            const predictionsToUpdate: Prediction[] = [];
            
            // Re-fetch match with predictions to ensure we have them (or pass them in event if feasible, but fetching is safer for freshness)
            // Actually, querying predictions separately might be better for memory if there are thousands.
            // For now, let's assume we fetch them.
            const matchWithPreds = await this.matchesRepository.findOne({
                where: { id: matchId },
                relations: ['predictions']
            });

            if (matchWithPreds && matchWithPreds.predictions) {
                for (const prediction of matchWithPreds.predictions) {
                    // Update prediction with the finalized score
                    // Note: The match passed in event has the new scores, but the DB object 'matchWithPreds' 
                    // should have them too if we saved before emitting.
                    // We'll trust the DB state is up to date since we emit AFTER save.
                    
                    const points = this['scoringService'].calculatePoints(matchWithPreds, prediction);
                    prediction.points = points;
                    predictionsToUpdate.push(prediction);
                }
            }

            if (predictionsToUpdate.length > 0) {
                await this.predictionsRepository.save(predictionsToUpdate);
                this.logger.log(`✅ Recalculated points for ${predictionsToUpdate.length} predictions in match ${matchId}`);
            }

            // 2. Calculate bracket points
            const winner = homeScore > awayScore ? match.homeTeam : match.awayTeam;
            await this.bracketsService.calculateBracketPoints(matchId, winner);
            this.logger.log(`🏆 Bracket points calculated for match ${matchId}, winner: ${winner}`);

            // 3. Status updates & Progression
            
            // Check and unlock next knockout phase
            if (match.phase) {
                await this.knockoutPhasesService.checkAndUnlockNextPhase(match.phase);
            }

            // Handling Semifinal Losers -> 3rd Place
            if (match.phase === 'SEMI') {
                const loser = homeScore < awayScore ? match.homeTeam : match.awayTeam;
                const loserFlag = homeScore < awayScore ? match.homeFlag : match.awayFlag;
                const thirdPlaceMatch = await this.matchesRepository.findOne({ where: { phase: '3RD_PLACE' } });
                
                if (thirdPlaceMatch && loser) {
                    const isHome = (match.bracketId % 2) !== 0;
                    if (isHome) {
                        thirdPlaceMatch.homeTeam = loser;
                        thirdPlaceMatch.homeFlag = loserFlag;
                        thirdPlaceMatch.homeTeamPlaceholder = null;
                    } else {
                        thirdPlaceMatch.awayTeam = loser;
                        thirdPlaceMatch.awayFlag = loserFlag;
                        thirdPlaceMatch.awayTeamPlaceholder = null;
                    }
                    await this.matchesRepository.save(thirdPlaceMatch);
                    this.logger.log(`🥉 Sent loser ${loser} to 3RD_PLACE match`);
                }
            }

            // Group Promotion
            if (match.phase === 'GROUP' && match.group) {
                await this.tournamentService.promoteFromGroup(match.group);
            }

            // Next Match Promotion
            if (match.nextMatchId) {
                const nextMatch = await this.matchesRepository.findOne({ where: { id: match.nextMatchId } });
                if (nextMatch) {
                    const isHome = (match.bracketId % 2) !== 0;
                    const winner = homeScore > awayScore ? match.homeTeam : match.awayTeam;
                    const winnerFlag = homeScore > awayScore ? match.homeFlag : match.awayFlag;

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
                    this.logger.log(`➡️ Promoted ${winner} to next match ${nextMatch.id}`);
                }
            }

        } catch (error) {
            this.logger.error(`❌ Error processing async match finish for ${matchId}`, error);
        }
    }
}
