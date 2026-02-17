import { Controller, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { BroadcastService } from './broadcast.service';

@Controller('admin/broadcast')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
export class BroadcastController {
  private readonly logger = new Logger(BroadcastController.name);

  constructor(private readonly broadcastService: BroadcastService) {}

  @Post()
  async sendBroadcast(@Body() body: { subject: string; message: string; target: 'ALL' | 'NO_PREDICTION' }) {
    this.logger.log(`📥 Received broadcast request: ${body.subject} (Target: ${body.target})`);
    
    // Fire and forget or wait?
    // Since it can take time, maybe return "in progress"
    // But let's wait for now to give feedback to admin
    const results = await this.broadcastService.broadcastEmail(body.subject, body.message, body.target);
    
    return {
      success: true,
      message: `Broadcast completed. Sent: ${results.sent}, Failed: ${results.failed}`,
      results,
    };
  }
}
