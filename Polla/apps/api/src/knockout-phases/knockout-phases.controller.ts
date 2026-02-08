import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Headers,
  Query,
} from '@nestjs/common';
import { KnockoutPhasesService } from './knockout-phases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('knockout-phases')
export class KnockoutPhasesController {
  constructor(private readonly knockoutPhasesService: KnockoutPhasesService) {}

  private getTournamentId(headers: any, query: any): string {
    return headers['x-tournament-id'] || query.tournamentId || 'WC2026';
  }

  /**
   * Get status of all phases
   */
  @Get('status')
  async getAllPhasesStatus(@Headers() headers: any, @Query() query: any) {
    const tournamentId = this.getTournamentId(headers, query);
    return this.knockoutPhasesService.getAllPhasesStatus(tournamentId);
  }

  /**
   * Get status of specific phase
   */
  @Get(':phase/status')
  async getPhaseStatus(
    @Param('phase') phase: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const tournamentId = this.getTournamentId(headers, query);
    return this.knockoutPhasesService.getPhaseStatus(phase, tournamentId);
  }

  /**
   * Get matches for a specific phase
   * Requires authentication
   */
  @UseGuards(JwtAuthGuard)
  @Get(':phase/matches')
  async getPhaseMatches(
    @Param('phase') phase: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const tournamentId = this.getTournamentId(headers, query);
    return this.knockoutPhasesService.getPhaseMatches(phase, tournamentId);
  }

  /**
   * Manually unlock a phase (ADMIN only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post(':phase/unlock')
  async unlockPhase(
    @Param('phase') phase: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const tournamentId = this.getTournamentId(headers, query);
    return this.knockoutPhasesService.unlockPhase(phase, tournamentId);
  }

  /**
   * Get info about next phase to unlock
   */
  @Get('next/info')
  async getNextPhaseInfo(@Headers() headers: any, @Query() query: any) {
    const tournamentId = this.getTournamentId(headers, query);
    return this.knockoutPhasesService.getNextPhaseInfo(tournamentId);
  }

  /**
   * Check and unlock next phase if current is complete (ADMIN only)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  @Post(':phase/check-unlock')
  async checkAndUnlockNextPhase(
    @Param('phase') phase: string,
    @Headers() headers: any,
    @Query() query: any,
  ) {
    const tournamentId = this.getTournamentId(headers, query);
    await this.knockoutPhasesService.checkAndUnlockNextPhase(
      phase,
      tournamentId,
    );
    return {
      message: `Checked ${phase} and unlocked next phase if ready for ${tournamentId}`,
    };
  }
}
