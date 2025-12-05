import { Prediction } from './prediction.entity';
export declare class Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number | null;
    awayScore: number | null;
    date: Date;
    homeFlag: string;
    awayFlag: string;
    phase: string;
    group: string;
    homeTeamPlaceholder: string | null;
    awayTeamPlaceholder: string | null;
    bracketId: number;
    nextMatchId: string;
    status: string;
    externalId: number;
    isLocked: boolean;
    predictions: Prediction[];
}
