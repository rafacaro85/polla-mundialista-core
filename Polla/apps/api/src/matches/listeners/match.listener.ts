
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
        const { match: eventMatch } = event; // No confiamos en los scores del evento para el cálculo crítico
        const matchId = eventMatch.id;

        this.logger.log(`⚡ [START] Buscando data fresca para partido ${matchId}...`);
        
        // 🛡️ PEQUEÑO DELAY DE SEGURIDAD (500ms)
        // Esto asegura que la transacción principal de "matches.service" haya hecho commit
        // y la base de datos tenga los datos finales disponibles para lectura.
        await new Promise(resolve => setTimeout(resolve, 500)); 

        try {
            // 🔎 FETCH DE "LA VERDAD" (Source of Truth)
            const freshMatch = await this.matchesRepository.findOne({
                where: { id: matchId },
                relations: ['predictions']
            });

            if (!freshMatch) {
                this.logger.error(`❌ CRÍTICO: No se encontró el partido ${matchId} en base de datos al procesar evento.`);
                return;
            }

            // Validación de integridad de datos
            if (freshMatch.homeScore === null || freshMatch.awayScore === null) {
                this.logger.warn(`⚠️ ALERTA: El partido ${matchId} se leyó con scores NULL. Es posible que la transacción no haya terminado.`);
                return;
            }

            const homeScore = freshMatch.homeScore;
            const awayScore = freshMatch.awayScore;

            this.logger.log(`📊 [CALCULO] Data confirmada BD: ${freshMatch.homeTeam} (${homeScore}) - (${awayScore}) ${freshMatch.awayTeam}`);

            // 1. Recalcular puntos para todas las predicciones
            const predictionsToUpdate: Prediction[] = [];
          
            if (freshMatch.predictions) {
                for (const prediction of freshMatch.predictions) {
                    // Usamos freshMatch que tiene los scores reales de la BD
                    const points = this.scoringService.calculatePoints(freshMatch, prediction);
                    prediction.points = points;
                    predictionsToUpdate.push(prediction);
                }
            }

            if (predictionsToUpdate.length > 0) {
                await this.predictionsRepository.save(predictionsToUpdate);
                this.logger.log(`✅ Recalculated points for ${predictionsToUpdate.length} predictions in match ${matchId}`);
            }

            // 2. Calculate bracket points
            const winner = homeScore > awayScore ? freshMatch.homeTeam : freshMatch.awayTeam;
            await this.bracketsService.calculateBracketPoints(matchId, winner);
            this.logger.log(`🏆 Bracket points calculated for match ${matchId}, winner: ${winner}`);

            // 3. Status updates & Progression
            
            // Check and unlock next knockout phase
            if (freshMatch.phase) {
                await this.knockoutPhasesService.checkAndUnlockNextPhase(freshMatch.phase, freshMatch.tournamentId);
            }

            // Handling Semifinal Losers -> 3rd Place
            if (freshMatch.phase === 'SEMI') {
                const loser = homeScore < awayScore ? freshMatch.homeTeam : freshMatch.awayTeam;
                const loserFlag = homeScore < awayScore ? freshMatch.homeFlag : freshMatch.awayFlag;
                const thirdPlaceMatch = await this.matchesRepository.findOne({ where: { phase: '3RD_PLACE' } });
                
                if (thirdPlaceMatch && loser) {
                    const isHome = (freshMatch.bracketId % 2) !== 0;
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
            if (freshMatch.phase === 'GROUP' && freshMatch.group) {
                await this.tournamentService.promoteFromGroup(freshMatch.group);
            }

            // Next Match Promotion
            if (freshMatch.nextMatchId) {
                const nextMatch = await this.matchesRepository.findOne({ where: { id: freshMatch.nextMatchId } });
                if (nextMatch) {
                    const isHome = (freshMatch.bracketId % 2) !== 0;
                    const winner = homeScore > awayScore ? freshMatch.homeTeam : freshMatch.awayTeam;
                    const winnerFlag = homeScore > awayScore ? freshMatch.homeFlag : freshMatch.awayFlag;

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
