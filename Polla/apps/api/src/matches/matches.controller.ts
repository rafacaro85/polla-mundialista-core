import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Header,
} from '@nestjs/common';
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
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: any): Promise<Match[]> {
    const isAdmin = req.user.role === 'ADMIN';
    const tournamentId =
      req.headers['x-tournament-id'] || req.query.tournamentId || 'WC2026';
    return this.matchesService.findAll(req.user.id, isAdmin, tournamentId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('live')
  @Header('Cache-Control', 'public, max-age=30')
  async findLive(@Request() req: any): Promise<Match[]> {
    const isAdmin = req.user?.role === 'ADMIN';
    const tournamentId =
      req.headers['x-tournament-id'] || req.query.tournamentId || 'WC2026';
    return this.matchesService.findLive(isAdmin, tournamentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  async createMatch(
    @Body()
    body: {
      homeTeam: string;
      awayTeam: string;
      date: Date;
      externalId?: number;
      stadium?: string;
      leagueId?: number;
      tournamentId?: string;
    },
    @Request() req: any,
  ) {
    const tournamentId =
      body.tournamentId || req.headers['x-tournament-id'] || 'WC2026';
    return this.matchesService.createMatch({
      homeTeam: body.homeTeam,
      awayTeam: body.awayTeam,
      date: body.date,
      externalId: body.externalId,
      tournamentId,
    });
  }

  // Endpoint protegido solo para ADMIN
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  async updateMatch(
    @Param('id') id: string,
    @Body()
    body: {
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
      isManuallyLocked?: boolean;
    },
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
  async finishMatch(
    @Param('id') id: string,
    @Body() body: { homeScore: number; awayScore: number },
  ) {
    return this.matchesService.finishMatch(id, body.homeScore, body.awayScore);
  }

  // Endpoint de prueba/simulación para validar sincronización (solo ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('simulate-sync')
  async simulateSync(@Body() fixtureData: any) {
    const result = await this.matchSyncService.processFixtureData(fixtureData);
    return {
      message: result
        ? 'Partido actualizado'
        : 'No se detectaron cambios o no se encontró el partido',
      dataProcessed: true,
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('simulate-results')
  async simulateResults(
    @Body() body: { phase?: string; tournamentId?: string },
    @Request() req: any,
  ) {
    try {
      // body puede ser undefined si el request no tiene JSON
      const phase = body?.phase;
      const tournamentId =
        body?.tournamentId || req.headers['x-tournament-id'] || 'WC2026';
      return await this.matchesService.simulateResults(phase, tournamentId);
    } catch (e: any) {
      const fs = require('fs');
      fs.writeFileSync(
        'controller_error.log',
        JSON.stringify(
          {
            message: e.message,
            stack: e.stack,
            name: e.name,
            detail: e,
          },
          null,
          2,
        ),
      );
      console.error('CONTROLLER CAUGHT ERROR:', e);
      throw e;
    }
  }

  // Alias con guion bajo para compatibilidad con el componente frontend
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('simulate_results')
  async simulateResultsUnderscore(@Body() body: { phase?: string }) {
    return this.matchesService.simulateResults(body.phase);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('reset-all')
  async resetAllMatches(
    @Body() body: { tournamentId?: string },
    @Request() req: any,
  ) {
    const tournamentId = body?.tournamentId || req.headers['x-tournament-id'];
    return this.matchesService.resetAllMatches(tournamentId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('promote-groups')
  async promoteGroups() {
    await this.matchesService.promoteAllGroups();
    return {
      message: 'Verificación de promoción completada para todos los grupos',
    };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('seed-r32')
  async seedRound32(
    @Body() body: { tournamentId?: string },
    @Request() req: any,
  ) {
    const tid = body?.tournamentId || req.headers['x-tournament-id'] || 'WC2026';
    return this.matchesService.seedRound32(tid);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('repair-tournament')
  async repairTournament(
    @Body() body: { tournamentId?: string },
    @Request() req: any,
  ) {
    const tid = body?.tournamentId || req.headers['x-tournament-id'] || 'WC2026';
    return this.matchesService.ensureTournamentIntegrity(tid);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('fix-ucl-data')
  async fixUCLData() {
    return this.matchesService.fixUCLMatchData();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post('fix-empty-teams')
  async fixEmptyTeams() {
    return this.matchesService.fixEmptyTeamFields();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('teams/rename')
  async renameTeam(@Body() body: { oldName: string; newCode: string }) {
    return this.matchesService.renameTeam(body.oldName, body.newCode);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/set-teams')
  async setTeams(
    @Param('id') id: string,
    @Body() body: { homeTeamCode: string; awayTeamCode: string },
  ) {
    return this.matchesService.setTeams(
      id,
      body.homeTeamCode,
      body.awayTeamCode,
    );
  }

  /**
   * Toggle manual lock for a match
   * Emergency kill switch for admins
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/lock')
  async toggleMatchLock(
    @Param('id') id: string,
    @Body() body: { locked: boolean },
  ) {
    return this.matchesService.setManualLock(id, body.locked);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch('phases/:phase/lock')
  async togglePhaseLock(
    @Param('phase') phase: string,
    @Body() body: { locked: boolean; tournamentId?: string },
    @Request() req: any,
  ) {
    const tournamentId =
      body.tournamentId || req.headers['x-tournament-id'] || 'WC2026';
    return this.matchesService.setPhaseLock(phase, body.locked, tournamentId);
  }

  /**
   * Get status of all knockout phases
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get('phases/status')
  async getPhaseStatus(@Request() req: any) {
    const tournamentId =
      req.headers['x-tournament-id'] || req.query.tournamentId || 'WC2026';
    return this.matchesService.getAllPhaseStatus(tournamentId);
  }
}
