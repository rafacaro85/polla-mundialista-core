import { League } from './league.entity';
export declare class BonusQuestion {
    id: string;
    text: string;
    points: number;
    correctAnswer: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    league: League;
    leagueId: string;
}
