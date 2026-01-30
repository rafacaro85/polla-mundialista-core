import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BracketsController } from './brackets.controller';
import { BracketsService } from './brackets.service';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';

@Module({
    imports: [TypeOrmModule.forFeature([UserBracket, Match, LeagueParticipant, KnockoutPhaseStatus])],
    controllers: [BracketsController],
    providers: [BracketsService],
    exports: [BracketsService],
})
export class BracketsModule { }
