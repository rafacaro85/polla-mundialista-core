import { Controller, Post, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
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

}


