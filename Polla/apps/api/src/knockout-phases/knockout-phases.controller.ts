import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { KnockoutPhasesService } from './knockout-phases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('knockout-phases')
export class KnockoutPhasesController {
    constructor(private readonly knockoutPhasesService: KnockoutPhasesService) { }

    /**
     * Get status of all phases
     * Public endpoint - anyone can see which phases are unlocked
     */
    @Get('status')
    async getAllPhasesStatus() {
        return this.knockoutPhasesService.getAllPhasesStatus();
    }

    /**
     * Get status of specific phase
     */
    @Get(':phase/status')
    async getPhaseStatus(@Param('phase') phase: string) {
        return this.knockoutPhasesService.getPhaseStatus(phase);
    }

    /**
     * Get matches for a specific phase
     * Requires authentication
     */
    @UseGuards(JwtAuthGuard)
    @Get(':phase/matches')
    async getPhaseMatches(@Param('phase') phase: string) {
        return this.knockoutPhasesService.getPhaseMatches(phase);
    }

    /**
     * Manually unlock a phase (ADMIN only)
     */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Post(':phase/unlock')
    async unlockPhase(@Param('phase') phase: string) {
        return this.knockoutPhasesService.unlockPhase(phase);
    }

    /**
     * Get info about next phase to unlock
     */
    @Get('next/info')
    async getNextPhaseInfo() {
        return this.knockoutPhasesService.getNextPhaseInfo();
    }

    /**
     * Check and unlock next phase if current is complete (ADMIN only)
     */
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    @Post(':phase/check-unlock')
    async checkAndUnlockNextPhase(@Param('phase') phase: string) {
        await this.knockoutPhasesService.checkAndUnlockNextPhase(phase);
        return { message: `Checked ${phase} and unlocked next phase if ready` };
    }
}
