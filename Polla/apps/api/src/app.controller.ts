import { Controller, Get, Query } from '@nestjs/common';
import { AppService } from './app.service';
import { AdminService } from './admin/admin.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly adminService: AdminService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('emergency-migrate')
  async migrate(@Query('key') key: string) {
    return this.adminService.runMigration(key);
  }
}
