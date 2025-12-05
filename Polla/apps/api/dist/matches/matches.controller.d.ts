import { MatchesService } from './matches.service';
import { Match } from '../database/entities/match.entity';
import { MatchSyncService } from './match-sync.service';
export declare class MatchesController {
    private readonly matchesService;
    private readonly matchSyncService;
    constructor(matchesService: MatchesService, matchSyncService: MatchSyncService);
    findAll(req: any): Promise<Match[]>;
    createMatch(body: {
        homeTeam: string;
        awayTeam: string;
        date: Date;
        externalId?: number;
        stadium?: string;
        leagueId?: number;
    }): unknown;
    updateMatch(id: string, body: {
        status?: string;
        homeScore?: number | null;
        awayScore?: number | null;
        phase?: string;
        group?: string;
        homeTeamPlaceholder?: string;
        awayTeamPlaceholder?: string;
        homeTeam?: string;
        awayTeam?: string;
        date?: Date;
        bracketId?: number;
        nextMatchId?: string;
        isLocked?: boolean;
    }): unknown;
    forceSync(): unknown;
    finishMatch(id: string, body: {
        homeScore: number;
        awayScore: number;
    }): unknown;
    seedKnockoutMatches(): unknown;
    resetKnockoutMatches(): unknown;
}
