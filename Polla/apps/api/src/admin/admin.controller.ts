import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed-ucl')
  @HttpCode(HttpStatus.OK)
  async seedUCL() {
    return this.adminService.seedUCLMatches();
  }

  // --- START TEMPORARY SEED ENDPOINT ---
  @Post('seed-ucl-matches')
  @HttpCode(HttpStatus.OK)
  async seedUCLKnockouts() {
    // Temporarily unprotected strictly for the user's manual run, 
    // but the controller sits under /admin and will be deleted right after.
    return this.adminService.seedUCLMatchesKnockouts();
  }
  // --- END TEMPORARY SEED ENDPOINT ---
}

