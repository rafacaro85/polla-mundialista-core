import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Prediction, Match, LeagueParticipant])],
    controllers: [PredictionsController],
    providers: [PredictionsService],
})
export class PredictionsModule { }
