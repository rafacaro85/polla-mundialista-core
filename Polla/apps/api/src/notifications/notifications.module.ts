import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from '../database/entities/notification.entity';
import { User } from '../database/entities/user.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { PhaseCompletedListener } from './listeners/phase-completed.listener';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, Prediction])],
  controllers: [NotificationsController],
  providers: [NotificationsService, PhaseCompletedListener],
  exports: [NotificationsService],
})
export class NotificationsModule {}
