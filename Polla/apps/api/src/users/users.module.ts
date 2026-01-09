import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, League, LeagueParticipant, Prediction, UserBracket])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule { }
