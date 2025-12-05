import { LeagueParticipantsService } from './league-participants.service';
export declare class LeagueParticipantsController {
    private readonly leagueParticipantsService;
    constructor(leagueParticipantsService: LeagueParticipantsService);
    assignTriviaPoints(leagueId: string, userId: string, points: number, req: any): unknown;
}
