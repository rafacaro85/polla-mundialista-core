import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AdminService } from './admin.service';
import { Public } from '../common/decorators/public.decorator';


@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('seed-ucl')
  @HttpCode(HttpStatus.OK)
  async seedUCL() {
    return this.adminService.seedUCLMatches();
  }

  @Post('seed-heimcore')
  @HttpCode(HttpStatus.OK)
  @Public()
  async seedHeimcore() {
    return this.adminService.seedHeimcore();
  }
}
