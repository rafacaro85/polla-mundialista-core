import { Module } from '@nestjs/common';
import { ScoringService } from './scoring.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Match, Prediction])],
  providers: [ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
