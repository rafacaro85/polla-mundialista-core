import { Controller, Post, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed-ucl')
  @HttpCode(HttpStatus.OK)
  async seedUCL() {
    return this.adminService.seedUCLMatches();
  }

  @Get('diagnose')
  async diagnose(@Query('key') key: string) {
    return this.adminService.diagnoseSchema(key);
  }

  @Get('migrate')
  async migrate(@Query('key') key: string) {
    return this.adminService.runMigration(key);
  }
}
