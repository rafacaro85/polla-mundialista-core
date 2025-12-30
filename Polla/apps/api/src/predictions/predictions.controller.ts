import { Controller, Post, Get, Body, UseGuards, Request, Delete, Param, Query } from '@nestjs/common';
import { PredictionsService } from './predictions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreatePredictionDto } from './dto/create-prediction.dto';

@Controller('predictions')
export class PredictionsController {
    constructor(private readonly predictionsService: PredictionsService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async upsertPrediction(@Request() req: any, @Body() body: CreatePredictionDto) {
        try {
            console.log('Upserting prediction for user:', req.user.id, 'match:', body.matchId);
            return await this.predictionsService.upsertPrediction(req.user.id, body.matchId, body.homeScore, body.awayScore, body.leagueId, body.isJoker);
        } catch (error) {
            console.error('Error upserting prediction:', error);
            throw error; // Let NestJS handle known exceptions, or wrap unknown ones
        }
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async getMyPredictions(@Request() req: any) {
        return this.predictionsService.findAllByUser(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':matchId')
    async deletePrediction(@Request() req: any, @Param('matchId') matchId: string, @Query('leagueId') leagueId?: string) {
        return this.predictionsService.removePrediction(req.user.id, matchId, leagueId);
    }
}
