import { League } from './league.entity';
import { User } from './user.entity';
export declare class LeagueParticipant {
    id: string;
    league: League;
    user: User;
    totalPoints: number;
    currentRank?: number;
    isAdmin: boolean;
    isBlocked: boolean;
    triviaPoints: number;
}
