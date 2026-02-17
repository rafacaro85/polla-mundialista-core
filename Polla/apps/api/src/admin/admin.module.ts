import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { Match } from '../database/entities/match.entity';
import { User } from '../database/entities/user.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Match, KnockoutPhaseStatus, User, Prediction]),
    MailModule,
  ],
  controllers: [AdminController, BroadcastController],
  providers: [AdminService, BroadcastService],
})
export class AdminModule {}
