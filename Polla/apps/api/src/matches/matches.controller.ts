import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, Header } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { Match } from '../database/entities/match.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { MatchSyncService } from './match-sync.service';

@Controller('matches')
export class MatchesController {
    constructor(
        private readonly matchesService: MatchesService,
        private readonly matchSyncService: MatchSyncService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Get()
    async findAll(@Request() req: any): Promise<Match[]> {
        const isAdmin = req.user.role === 'ADMIN';
        return this.matchesService.findAll(req.user.id, isAdmin);
    }

    @UseGuards(JwtAuthGuard)
    @Get('live')
    @Header('Cache-Control', 'public, max-age=30')
    async findLive(@Request() req: any): Promise<Match[]> {
        const isAdmin = req.user?.role === 'ADMIN';
        return this.matchesService.findLive(isAdmin);
    }



    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post()
    async createMatch(@Body() body: {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        externalId?: number;
        stadium?: string;
        leagueId?: number;
    }) {
        return this.matchesService.createMatch({
            homeTeam: body.homeTeam,
            awayTeam: body.awayTeam,
            date: body.date,
            externalId: body.externalId,
        });
    }

    // Endpoint protegido solo para ADMIN
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Patch(':id')
    async updateMatch(
        @Param('id') id: string,
        @Body() body: {
            status?: string;
            homeScore?: number | null;
            awayScore?: number | null;
            phase?: string;
            group?: string;
            homeTeamPlaceholder?: string;
            awayTeamPlaceholder?: string;
            homeTeam?: string;
            awayTeam?: string;
            date?: Date;
            bracketId?: number;
            nextMatchId?: string;
            isLocked?: boolean;
        }
    ) {
        return this.matchesService.updateMatch(id, body);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('sync')
    async forceSync() {
        await this.matchSyncService.syncLiveMatches();
        return { message: 'Sincronización forzada iniciada' };
    }

    // TODO: Deprecar este endpoint en favor de PATCH
    @Post(':id/finish')
    async finishMatch(@Param('id') id: string, @Body() body: { homeScore: number; awayScore: number }) {
        return this.matchesService.finishMatch(id, body.homeScore, body.awayScore);
    }


    // Endpoint de prueba/simulación para validar sincronización (solo ADMIN)
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('simulate-sync')
    async simulateSync(@Body() fixtureData: any) {
        const result = await this.matchSyncService.processFixtureData(fixtureData);
        return {
            message: result ? 'Partido actualizado' : 'No se detectaron cambios o no se encontró el partido',
            dataProcessed: true
        };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('simulate-results')
    async simulateResults(@Body() body: { phase?: string }) {
        return this.matchesService.simulateResults(body.phase);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('reset-all')
    async resetAllMatches() {
        return this.matchesService.resetAllMatches();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('promote-groups')
    async promoteGroups() {
        await this.matchesService.promoteAllGroups();
        return { message: 'Verificación de promoción completada para todos los grupos' };
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @Post('seed-r32')
    async seedRound32() {
        return this.matchesService.seedRound32();
    }
}
