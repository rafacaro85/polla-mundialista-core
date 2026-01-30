import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Match } from '../database/entities/match.entity';
import { AiPredictionService } from './ai-prediction.service';
import { AiPredictionController } from './ai-prediction.controller';
import { MatchTeamsAssignedListener } from './listeners/match-teams-assigned.listener';

@Module({
  imports: [TypeOrmModule.forFeature([Match])],
  controllers: [AiPredictionController],
  providers: [AiPredictionService, MatchTeamsAssignedListener],
  exports: [AiPredictionService],
})
export class AiPredictionModule {}
