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
  @Post('start')
  async startDemo() {
    const result = await this.demoService.provisionDemo();
    
    // Auto-login as the Demo Admin returned by the service
    const { access_token, user } = await this.authService.login(result.admin);

    return {
      success: result.success,
      leagueId: result.leagueId,
      adminEmail: result.adminEmail,
      token: access_token,
      user
    };
  }

  @Post('simulate')
  async simulate(@Body('count') count?: number) {
    if (count && count > 1) {
        return this.demoService.simulateBatch(count);
    }
    return this.demoService.simulateNextMatch();
  }

  @Post('bonus')
  async createBonus(@Body() data: { text: string; points: number }) {
      return this.demoService.createBonus(data.text, data.points);
  }

  @Post('reset')
  async reset() {
    await this.demoService.clearDemoData();
    return { success: true };
  }
}
