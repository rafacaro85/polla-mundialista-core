import { Controller, Get, Param, UseGuards, Query } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get(':leagueId/executive-summary')
  async getExecutiveSummary(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getExecutiveSummary(leagueId, refresh === 'true');
  }

  @Get(':leagueId/final-ranking')
  async getFinalRanking(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getFinalRanking(leagueId, refresh === 'true');
  }

  @Get(':leagueId/department-participation')
  async getDepartmentParticipation(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getDepartmentParticipation(leagueId, refresh === 'true');
  }

  @Get(':leagueId/activity-by-matchday')
  async getActivityByMatchday(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getActivityByMatchday(leagueId, refresh === 'true');
  }

  @Get(':leagueId/predictions-analysis')
  async getPredictionsAnalysis(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getPredictionsAnalysis(leagueId, refresh === 'true');
  }

  @Get(':leagueId/joker-usage')
  async getJokerUsage(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getJokerUsage(leagueId, refresh === 'true');
  }

  @Get(':leagueId/bonus-questions')
  async getBonusQuestions(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getBonusQuestions(leagueId, refresh === 'true');
  }

  @Get(':leagueId/individual-evolution')
  async getIndividualEvolution(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getIndividualEvolution(leagueId, refresh === 'true');
  }

  @Get(':leagueId/top-players')
  async getTopPlayers(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getTopPlayers(leagueId, refresh === 'true');
  }

  @Get(':leagueId/engagement')
  async getEngagementROI(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    return this.analyticsService.getEngagementROI(leagueId, refresh === 'true');
  }

  @Get(':leagueId/full-report')
  async getFullReport(@Param('leagueId') leagueId: string, @Query('refresh') refresh: string) {
    const force = refresh === 'true';
    return {
      executiveSummary: await this.analyticsService.getExecutiveSummary(leagueId, force),
      finalRanking: await this.analyticsService.getFinalRanking(leagueId, force),
      departmentParticipation: await this.analyticsService.getDepartmentParticipation(leagueId, force),
      activityByMatchday: await this.analyticsService.getActivityByMatchday(leagueId, force),
      predictionsAnalysis: await this.analyticsService.getPredictionsAnalysis(leagueId, force),
      jokerUsage: await this.analyticsService.getJokerUsage(leagueId, force),
      bonusQuestions: await this.analyticsService.getBonusQuestions(leagueId, force),
      individualEvolution: await this.analyticsService.getIndividualEvolution(leagueId, force),
      topPlayers: await this.analyticsService.getTopPlayers(leagueId, force),
      engagementROI: await this.analyticsService.getEngagementROI(leagueId, force),
    };
  }
}
