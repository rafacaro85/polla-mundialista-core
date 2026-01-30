import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AiPredictionService } from '../ai-prediction.service';

/**
 * Event payload for match teams assignment
 */
export interface MatchTeamsAssignedEvent {
    matchId: string;
    homeTeam: string;
    awayTeam: string;
}

/**
 * Listener for automatic AI prediction generation when teams are assigned
 * 
 * Implements jitter (random delay) to prevent rate limit bursts when
 * multiple matches are updated simultaneously
 */
@Injectable()
export class MatchTeamsAssignedListener {
    private readonly logger = new Logger(MatchTeamsAssignedListener.name);

    constructor(private readonly aiPredictionService: AiPredictionService) {}

    @OnEvent('match.teams.assigned')
    async handleMatchTeamsAssigned(event: MatchTeamsAssignedEvent) {
        this.logger.log(
            `[EVENT] Teams assigned to match ${event.matchId}: ${event.homeTeam} vs ${event.awayTeam}`
        );

        // ✅ JITTER: Random delay between 5-15 seconds
        // This prevents rate limit bursts when admin updates multiple matches
        const jitter = Math.floor(Math.random() * 10000) + 5000; // 5000-15000ms
        
        this.logger.log(
            `[JITTER] Waiting ${(jitter / 1000).toFixed(1)}s before generating prediction...`
        );

        // Wait with jitter
        await new Promise(resolve => setTimeout(resolve, jitter));

        // Generate and save prediction
        try {
            await this.aiPredictionService.generateAndSave(event.matchId);
            this.logger.log(`[EVENT] ✅ Prediction generated for match ${event.matchId}`);
        } catch (error) {
            this.logger.error(
                `[EVENT] ❌ Failed to generate prediction for match ${event.matchId}:`,
                error.message
            );
        }
    }
}
