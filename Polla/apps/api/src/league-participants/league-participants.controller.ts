import { Controller, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { LeagueParticipantsService } from './league-participants.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request } from 'express';

@UseGuards(JwtAuthGuard)
@Controller('leagues/:leagueId/participants')
export class LeagueParticipantsController {
    constructor(private readonly leagueParticipantsService: LeagueParticipantsService) { }

    @Patch(':userId')
    async updateParticipant(
        @Param('leagueId') leagueId: string,
        @Param('userId') userId: string,
        @Body() body: { department?: string },
        @Req() req: any,
    ) {
        const userPayload = req.user as { id: string; role: string };
        return this.leagueParticipantsService.updateParticipant(
            leagueId,
            userId,
            body,
            userPayload.id,
            userPayload.role,
        );
    }

    @Post(':userId/trivia-points')
    async assignTriviaPoints(
        @Param('leagueId') leagueId: string,
        @Param('userId') userId: string,
        @Body('points') points: number,
        @Req() req: any,
    ) {
        const userPayload = req.user as { id: string; role: string };
        return this.leagueParticipantsService.assignTriviaPoints(
            leagueId,
            userId,
            points,
            userPayload.id,
            userPayload.role,
        );
    }
}
