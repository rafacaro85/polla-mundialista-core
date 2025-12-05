import { Repository, DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { ScoringService } from '../scoring/scoring.service';
import { BracketsService } from '../brackets/brackets.service';
import { TournamentService } from '../tournament/tournament.service';
export declare class MatchesService {
    private matchesRepository;
    private predictionsRepository;
    private scoringService;
    private dataSource;
    private bracketsService;
    private tournamentService;
    constructor(matchesRepository: Repository<Match>, predictionsRepository: Repository<Prediction>, scoringService: ScoringService, dataSource: DataSource, bracketsService: BracketsService, tournamentService: TournamentService);
    findAll(userId?: string): Promise<Match[]>;
    createMatch(data: {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        externalId?: number;
    }): Promise<Match>;
    finishMatch(matchId: string, homeScore: number, awayScore: number): Promise<Match>;
    updateMatch(id: string, data: any): Promise<Match>;
    seedKnockoutMatches(): Promise<{
        message: string;
        created: number;
    }>;
    resetKnockoutMatches(): Promise<{
        message: string;
        reset: number;
    }>;
}
