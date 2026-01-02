import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ScoringModule } from './scoring/scoring.module';
import { LeaguesModule } from './leagues/leagues.module';
import { AccessCodesModule } from './access-codes/access-codes.module';
import { LeagueParticipantsModule } from './league-participants/league-participants.module';
import { MatchesModule } from './matches/matches.module';
import { PredictionsModule } from './predictions/predictions.module';
import { BracketsModule } from './brackets/brackets.module';
import { BonusModule } from './bonus/bonus.module';
import { StandingsModule } from './standings/standings.module';
import { TournamentModule } from './tournament/tournament.module';
import { TransactionsModule } from './transactions/transactions.module';
import { DebugModule } from './debug/debug.module';
import { KnockoutPhasesModule } from './knockout-phases/knockout-phases.module';

// Import all entities
import { Organization } from './database/entities/organization.entity';
import { User } from './database/entities/user.entity';
import { League } from './database/entities/league.entity';
import { LeagueParticipant } from './database/entities/league-participant.entity';
import { AccessCode } from './database/entities/access-code.entity';
import { Match } from './database/entities/match.entity';
import { Prediction } from './database/entities/prediction.entity';
import { UserBracket } from './database/entities/user-bracket.entity';
import { BonusQuestion } from './database/entities/bonus-question.entity';
import { UserBonusAnswer } from './database/entities/user-bonus-answer.entity';
import { Transaction } from './database/entities/transaction.entity';
import { SystemConfig } from './database/entities/system-config.entity';
import { SystemSettings } from './system-settings/entities/system-setting.entity';
import { KnockoutPhaseStatus } from './database/entities/knockout-phase-status.entity';
import { LeagueComment } from './database/entities/league-comment.entity';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { UploadModule } from './upload/upload.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: parseInt(configService.get<string>('DB_PORT')!, 10),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [
          Organization,
          User,
          League,
          LeagueParticipant,
          AccessCode,
          Match,
          Prediction,
          UserBracket,
          BonusQuestion,
          UserBonusAnswer,
          Transaction,
          SystemConfig,
          SystemSettings,
          KnockoutPhaseStatus,
          LeagueComment,
        ],
        synchronize: true, // Note: synchronize: true should not be used in production
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuthModule,
    ScoringModule,
    LeaguesModule,
    AccessCodesModule,
    LeagueParticipantsModule,
    MatchesModule,
    PredictionsModule,
    BracketsModule,
    BonusModule,
    StandingsModule,
    TournamentModule,
    TransactionsModule,
    SystemSettingsModule,
    UploadModule,
    DebugModule,
    KnockoutPhasesModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule { }
