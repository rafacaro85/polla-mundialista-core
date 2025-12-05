import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchesController } from './matches.controller';
import { MatchesService } from './matches.service';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ScoringModule } from '../scoring/scoring.module';
import { BracketsModule } from '../brackets/brackets.module';
import { TournamentModule } from '../tournament/tournament.module';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MatchSyncService } from './match-sync.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Match, Prediction]),
        BracketsModule,
        TournamentModule,
        ScoringModule,
        HttpModule.register({
            baseURL: 'https://v3.football.api-sports.io',
            headers: {
                'x-rapidapi-key': process.env.RAPIDAPI_KEY,
                'x-rapidapi-host': process.env.RAPIDAPI_HOST,
            },
        }),
        ScheduleModule.forRoot(),
    ],
    controllers: [MatchesController],
    providers: [MatchesService, MatchSyncService],
})
export class MatchesModule { }
