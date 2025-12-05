import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StandingsService, TeamStanding } from './standings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('standings')
export class StandingsController {
    constructor(private readonly standingsService: StandingsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('group/:group')
    async getGroupStandings(@Param('group') group: string): Promise<TeamStanding[]> {
        return this.standingsService.calculateGroupStandings(group);
    }

    @UseGuards(JwtAuthGuard)
    @Get('all')
    async getAllStandings(): Promise<{ [group: string]: TeamStanding[] }> {
        return this.standingsService.getAllGroupStandings();
    }
}
