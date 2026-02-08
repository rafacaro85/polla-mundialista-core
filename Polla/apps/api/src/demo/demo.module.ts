import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DemoService } from './demo.service';
import { DemoController } from './demo.controller';
import { League } from '../database/entities/league.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { MatchesModule } from '../matches/matches.module';
import { PredictionsModule } from '../predictions/predictions.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      League, 
      User, 
      LeagueParticipant, 
      Match, 
      Prediction, 
      BonusQuestion, 
      UserBonusAnswer
    ]),
    MatchesModule,
    PredictionsModule,
    AuthModule,
  ],
  providers: [DemoService],
  controllers: [DemoController],
  exports: [DemoService],
})
export class DemoModule {}
