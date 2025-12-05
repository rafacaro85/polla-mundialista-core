import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { Repository } from 'typeorm';
export declare class ScoringService {
    private matchesRepository;
    private predictionsRepository;
    constructor(matchesRepository: Repository<Match>, predictionsRepository: Repository<Prediction>);
    calculatePoints(match: Match, prediction: Prediction): number;
    calculatePointsForMatch(matchId: string): Promise<void>;
}
