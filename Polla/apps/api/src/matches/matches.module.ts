import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ScoringModule } from '../scoring/scoring.module';
import { BracketsModule } from '../brackets/brackets.module';
import { TournamentModule } from '../tournament/tournament.module';
import { KnockoutPhasesModule } from '../knockout-phases/knockout-phases.module';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchSyncService } from './match-sync.service';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';

import { MatchListener } from './listeners/match.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Match,
      Prediction,
      LeagueParticipant,
      UserBracket,
      KnockoutPhaseStatus,
    ]),
    BracketsModule,
    TournamentModule,
    KnockoutPhasesModule,
    ScoringModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        baseURL: 'https://v3.football.api-sports.io',
        headers: {
          'x-apisports-key': configService.get<string>('APISPORTS_KEY'),
        },
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [MatchesController],
  providers: [MatchesService, MatchSyncService, MatchListener],
  exports: [MatchesService],
})
export class MatchesModule {}
