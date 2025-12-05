import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
export interface TeamStanding {
    team: string;
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    points: number;
    position: number;
}
export declare class StandingsService {
    private matchesRepository;
    constructor(matchesRepository: Repository<Match>);
    calculateGroupStandings(group: string): Promise<TeamStanding[]>;
    getAllGroupStandings(): Promise<{
        [group: string]: TeamStanding[];
    }>;
}
