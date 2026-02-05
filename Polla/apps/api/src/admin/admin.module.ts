import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { Match } from '../database/entities/match.entity';

import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, KnockoutPhaseStatus])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
