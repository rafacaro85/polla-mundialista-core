import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeagueParticipantsService } from './league-participants.service';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { AccessCode } from '../database/entities/access-code.entity';

import { LeagueParticipantsController } from './league-participants.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([LeagueParticipant, User, League, AccessCode]),
  ],
  providers: [LeagueParticipantsService],
  controllers: [LeagueParticipantsController],
  exports: [LeagueParticipantsService],
})
export class LeagueParticipantsModule {}
