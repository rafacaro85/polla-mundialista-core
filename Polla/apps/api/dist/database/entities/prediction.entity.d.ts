import { User } from './user.entity';
import { Match } from './match.entity';
export declare class Prediction {
    id: string;
    user: User;
    match: Match;
    homeScore: number;
    awayScore: number;
    points: number;
}
