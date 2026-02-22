import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TransactionsService } from './transactions.service';
import { Transaction } from '../database/entities/transaction.entity';
import { League } from '../database/entities/league.entity';

import { TransactionsController } from './transactions.controller';
import { PdfModule } from '../common/pdf/pdf.module';

import { UploadModule } from '../upload/upload.module';
import { User } from '../database/entities/user.entity';
import { TelegramModule } from '../telegram/telegram.module';

import { LeagueParticipant } from '../database/entities/league-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Transaction, League, User, LeagueParticipant]),
    PdfModule,
    UploadModule,
    TelegramModule,
  ],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
