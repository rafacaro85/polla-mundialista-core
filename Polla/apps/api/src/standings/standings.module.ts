import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StandingsService } from './standings.service';
import { StandingsController } from './standings.controller';
import { Match } from '../database/entities/match.entity';
import { GroupStandingOverride } from '../database/entities/group-standing-override.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, GroupStandingOverride])],
  controllers: [StandingsController],
  providers: [StandingsService],
  exports: [StandingsService],
})
export class StandingsModule {}
