import { StandingsService, TeamStanding } from './standings.service';
export declare class StandingsController {
    private readonly standingsService;
    constructor(standingsService: StandingsService);
    getGroupStandings(group: string): Promise<TeamStanding[]>;
    getAllStandings(): Promise<{
        [group: string]: TeamStanding[];
    }>;
}
