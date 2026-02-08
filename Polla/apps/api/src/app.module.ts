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
import { MailModule } from './mail/mail.module';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';
import { TelegramModule } from './telegram/telegram.module';
import { AiPredictionModule } from './ai-prediction/ai-prediction.module';
import { PaymentsModule } from './payments/payments.module';
import { AdminModule } from './admin/admin.module';
import { DemoModule } from './demo/demo.module';


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
import { GroupStandingOverride } from './database/entities/group-standing-override.entity';
import { Notification } from './database/entities/notification.entity';
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
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        // Validación básica: Si no hay REDIS_HOST, usamos memoria (fallback seguro)
        const host = configService.get<string>('REDIS_HOST');
        if (!host) {
            console.warn('⚠️ REDIS_HOST no definido. Usando caché en memoria (No recomendado para producción).');
            return {
                ttl: 10000, // 10s default
            };
        }

        const store = await redisStore({
          socket: {
            host: host,
            port: parseInt(configService.get<string>('REDIS_PORT') || '6379'),
          },
          username: configService.get<string>('REDIS_USERNAME') || 'default',
          password: configService.get<string>('REDIS_PASSWORD'),
          ttl: 10000, 
        });

        return {
          store: store as any,
          ttl: 10000, // 10 segundos de vida por defecto para todo
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const url = configService.get<string>('DATABASE_URL');
        return {
          type: 'postgres',
          url: url,
          // Fallback if no URL
          host: url ? undefined : configService.get<string>('DB_HOST'),
          port: url ? undefined : parseInt(configService.get<string>('DB_PORT')!, 10),
          username: url ? undefined : configService.get<string>('DB_USERNAME'),
          password: url ? undefined : configService.get<string>('DB_PASSWORD'),
          database: url ? undefined : configService.get<string>('DB_DATABASE'),
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
            GroupStandingOverride,
            Notification,
          ],
          synchronize: true, // Note: synchronize: true should not be used in production
          ssl: url ? { rejectUnauthorized: false } : (configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : undefined),
          extra: {
            max: 50, // Aumentado para soportar alta concurrencia
            connectionTimeoutMillis: 5000,
          },
        };
      },
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60 seconds
      limit: 500, // ✅ Límite balanceado para producción
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
    NotificationsModule,
    MailModule,
    AiPredictionModule,
    PaymentsModule,
    AdminModule,
    DemoModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    EventEmitterModule.forRoot(),
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
