import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KnockoutPhasesService } from './knockout-phases.service';
import { KnockoutPhasesController } from './knockout-phases.controller';
import { KnockoutPhasesInitService } from './knockout-phases-init.service';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { Match } from '../database/entities/match.entity';

@Module({
  imports: [TypeOrmModule.forFeature([KnockoutPhaseStatus, Match])],
  controllers: [KnockoutPhasesController],
  providers: [KnockoutPhasesService, KnockoutPhasesInitService],
  exports: [KnockoutPhasesService],
})
export class KnockoutPhasesModule {}
