import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../database/enums/user-role.enum';
import { NotificationType } from '../database/entities/notification.entity';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req: any) {
    return this.notificationsService.findAll(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('read-all')
  async markAllRead(@Request() req: any) {
    return this.notificationsService.markAllRead(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('admin/broadcast')
  async broadcast(
    @Request() req: any,
    @Body()
    body: {
      title: string;
      message: string;
      type: NotificationType;
      targetAudience: 'ALL' | 'FREE' | 'PAID';
      tournamentId?: string;
    },
  ) {
    if (
      req.user.role !== UserRole.ADMIN &&
      req.user.email !== 'racv85@gmail.com'
    ) {
      // Hardcoded super admin fallback
      throw new ForbiddenException('Only admins can broadcast');
    }

    const count = await this.notificationsService.broadcast(
      body.title,
      body.message,
      body.type,
      body.targetAudience,
      body.tournamentId,
    );
    return { success: true, count };
  }
}
