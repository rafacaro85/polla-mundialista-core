import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonusController } from './bonus.controller';
import { BonusService } from './bonus.service';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';

import { League } from '../database/entities/league.entity';

import { LeagueParticipant } from '../database/entities/league-participant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BonusQuestion,
      UserBonusAnswer,
      League,
      LeagueParticipant,
    ]),
  ],
  controllers: [BonusController],
  providers: [BonusService],
  exports: [BonusService],
})
export class BonusModule {}
