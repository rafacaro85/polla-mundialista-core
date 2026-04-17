import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { RankingSnapshot } from '../database/entities/ranking-snapshot.entity';
import { UserSession } from '../database/entities/user-session.entity';
import { AnalyticsCache } from '../database/entities/analytics-cache.entity';
import { League } from '../database/entities/league.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { Match } from '../database/entities/match.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RankingSnapshot,
      UserSession,
      AnalyticsCache,
      League,
      Prediction,
      LeagueParticipant,
      Match
    ])
  ],
  providers: [AnalyticsService],
  controllers: [AnalyticsController],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
