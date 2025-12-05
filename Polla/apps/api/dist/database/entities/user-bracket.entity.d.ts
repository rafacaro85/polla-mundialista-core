import { User } from './user.entity';
import { League } from './league.entity';
export declare class UserBracket {
    id: string;
    user: User;
    userId: string;
    league: League;
    leagueId: string;
    picks: Record<string, string>;
    points: number;
    createdAt: Date;
    updatedAt: Date;
}
