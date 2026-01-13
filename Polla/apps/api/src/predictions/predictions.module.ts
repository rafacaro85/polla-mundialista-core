import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';

import { BracketsModule } from '../brackets/brackets.module';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { MatchesModule } from '../matches/matches.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Prediction, Match, LeagueParticipant, UserBracket]),
        BracketsModule,
        MatchesModule
    ],
    controllers: [PredictionsController],
    providers: [PredictionsService],
})
export class PredictionsModule { }
