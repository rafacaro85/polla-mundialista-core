import { Controller, Get, Param, UseGuards, UseInterceptors } from '@nestjs/common';
import { StandingsService, TeamStanding } from './standings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller('standings')
@UseInterceptors(CacheInterceptor) // ✅ Activamos caché para todo el controlador
export class StandingsController {
    constructor(private readonly standingsService: StandingsService) { }

    @UseGuards(JwtAuthGuard)
    @Get('group/:group')
    @CacheTTL(20000) // 20 segundos de caché
    async getGroupStandings(@Param('group') group: string): Promise<TeamStanding[]> {
        return this.standingsService.calculateGroupStandings(group);
    }

    @UseGuards(JwtAuthGuard)
    @Get('all')
    @CacheTTL(20000) // 20 segundos de caché (CRÍTICO para evitar colapso)
    async getAllStandings(): Promise<{ [group: string]: TeamStanding[] }> {
        return this.standingsService.getAllGroupStandings();
    }
}
