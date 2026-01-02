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

import { Prediction } from '../database/entities/prediction.entity';
import { LeagueComment } from '../database/entities/league-comment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([League, LeagueParticipant, User, AccessCode, Prediction, LeagueComment]),
    TransactionsModule,
    PdfModule,
  ],
  providers: [LeaguesService, AccessCodesService, LeagueParticipantsService],
  controllers: [LeaguesController],
  exports: [LeaguesService],
})
export class LeaguesModule { }
