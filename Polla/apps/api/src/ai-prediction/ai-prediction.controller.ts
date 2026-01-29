import { Controller, Get, Param, Delete, HttpCode } from '@nestjs/common';
import { AiPredictionService } from './ai-prediction.service';

@Controller('ai-predictions')
export class AiPredictionController {
  constructor(private readonly aiPredictionService: AiPredictionService) {}

  /**
   * Get AI prediction for a match
   * Implements cache-first pattern
   * 
   * @example GET /ai-predictions/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':matchId')
  async getPrediction(@Param('matchId') matchId: string) {
    return this.aiPredictionService.getPrediction(matchId);
  }

  /**
   * Clear cache for a specific match
   * Forces regeneration on next request
   * 
   * @example DELETE /ai-predictions/123e4567-e89b-12d3-a456-426614174000/cache
   */
  @Delete(':matchId/cache')
  @HttpCode(200)
  async clearCache(@Param('matchId') matchId: string) {
    return this.aiPredictionService.clearCache(matchId);
  }
}
