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
    
    // Auto-login as the Demo Admin
    const demoAdmin = {
        id: 'demo-admin-id', // Placeholder, we need the actual user object
        email: 'demo@lapollavirtual.com',
        fullName: 'Administrador Demo',
        role: UserRole.PLAYER,
        isVerified: true
    } as any;
    
    // Actually we should fetch the user from DB to be sure
    // For simplicity, let's assume provisionDemo returns enough or we fetch it
    const { access_token, user } = await this.demoService.provisionDemo().then(async (res) => {
        // Find the user created/fetched in provisionDemo
        // This is a bit circular but easier than passing the whole object
        const adminFromDb = await (this.demoService as any).userRepo.findOne({ where: { email: 'demo@lapollavirtual.com' } });
        return this.authService.login(adminFromDb);
    });

    return {
      ...result,
      token: access_token,
      user
    };
  }

  @Post('simulate')
  async simulate() {
    return this.demoService.simulateNextMatch();
  }

  @Post('reset')
  async reset() {
    await this.demoService.clearDemoData();
    return { success: true };
  }
}
