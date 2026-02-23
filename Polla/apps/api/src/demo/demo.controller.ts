import { Controller, Post, Body, Get } from '@nestjs/common';
import { DemoService } from './demo.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../database/enums/user-role.enum';
import { Public } from '../common/decorators/public.decorator';

@Controller('demo')
export class DemoController {
  constructor(
    private demoService: DemoService,
    private authService: AuthService,
  ) {}

  @Public() // Enable public access to start the demo
  @Post('start/enterprise')
  async startEnterpriseDemo(@Body('tournamentId') tournamentId: string) {
    const result = await this.demoService.provisionEnterpriseDemo(
      tournamentId || 'WC2026',
    );

    // Auto-login as the Demo Admin returned by the service
    const { access_token, user } = await this.authService.login(result.admin);

    return {
      success: result.success,
      leagueId: result.leagueId,
      adminEmail: result.adminEmail,
      token: access_token,
      user,
    };
  }

  @Public()
  @Post('start/social')
  async startSocialDemo(@Body('tournamentId') tournamentId: string) {
    const result = await this.demoService.provisionSocialDemo(
      tournamentId || 'WC2026',
    );

    const { access_token, user } = await this.authService.login(result.admin);

    return {
      success: result.success,
      leagueId: result.leagueId,
      adminEmail: result.adminEmail,
      token: access_token,
      user,
    };
  }

  @Post('simulate')
  async simulate(
    @Body('count') count?: number,
    @Body('tournamentId') tournamentId?: string,
  ) {
    if (count && count > 1) {
      return this.demoService.simulateBatch(count, tournamentId);
    }
    return this.demoService.simulateNextMatch(tournamentId);
  }

  @Post('bonus')
  async createBonus(
    @Body() data: { text: string; points: number; tournamentId?: string },
  ) {
    return this.demoService.createBonus(
      data.text,
      data.points,
      undefined,
      data.tournamentId,
    );
  }

  @Post('reset')
  async reset(
    @Body('leagueId') leagueId?: string,
    @Body('tournamentId') tournamentId?: string,
  ) {
    await this.demoService.clearDemoData(leagueId, tournamentId);
    return { success: true, message: 'Demo reseteado correctamente' };
  }
}
