import { Controller, Post, Get, HttpCode, HttpStatus, UseGuards, Body } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { DataSource } from 'typeorm';

@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly dataSource: DataSource
  ) {}


  @Post('seed-ucl')
  @HttpCode(HttpStatus.OK)
  async seedUCL() {
    return this.adminService.seedUCLMatches();
  }

  @Post('seed-ucl-matches')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  async reseedUCLMatches() {
    return this.adminService.reseedUCLMatches();
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


}
