import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed-ucl')
  @HttpCode(HttpStatus.OK)
  async seedUCL() {
    return this.adminService.seedUCLMatches();
  }

  // --- START TEMPORARY UCL PHASES ENDPOINT ---
  @Post('fix-ucl-phases')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async fixUCLPhases() {
    return this.adminService.fixUCLPhases();
  }
  // --- END TEMPORARY UCL PHASES ENDPOINT ---

  // --- START TEMPORARY DEBUG ---
  @Get('debug-tables')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async debugTables() {
    return this.adminService.debugTables();
  }

  @Get('debug-columns')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async debugColumns() {
    return this.adminService.debugColumns();
  }
  // --- END TEMPORARY DEBUG ---
}
