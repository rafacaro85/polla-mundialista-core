import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeaguesService } from './leagues.service';
import { LeaguesController } from './leagues.controller';
import { League } from '../database/entities/league.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { User } from '../database/entities/user.entity';
import { AccessCode } from '../database/entities/access-code.entity';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { LeagueParticipantsService } from '../league-participants/league-participants.service';
import { TransactionsModule } from '../transactions/transactions.module';
import { PdfModule } from '../common/pdf/pdf.module';
import { TelegramModule } from '../telegram/telegram.module';

import { Prediction } from '../database/entities/prediction.entity';
import { LeagueComment } from '../database/entities/league-comment.entity';
import { LeaguePrize } from '../database/entities/league-prize.entity';
import { LeagueBanner } from '../database/entities/league-banner.entity';
import { LeagueExtraService } from './league-extra.service';
import { LeagueExtraController } from './league-extra.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      League,
      LeagueParticipant,
      User,
      AccessCode,
      Prediction,
      LeagueComment,
      LeaguePrize,
      LeagueBanner,
    ]),
    TransactionsModule,
    PdfModule,
    TelegramModule,
  ],
  providers: [
    LeaguesService,
    AccessCodesService,
    LeagueParticipantsService,
    LeagueExtraService,
  ],
  controllers: [LeaguesController, LeagueExtraController],
  exports: [LeaguesService],
})
export class LeaguesModule {}
