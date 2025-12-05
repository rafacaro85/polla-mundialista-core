import { Repository } from 'typeorm';
import { Prediction } from '../database/entities/prediction.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
export declare class PredictionsService {
    private predictionsRepository;
    private matchesRepository;
    private leagueParticipantRepository;
    constructor(predictionsRepository: Repository<Prediction>, matchesRepository: Repository<Match>, leagueParticipantRepository: Repository<LeagueParticipant>);
    upsertPrediction(userId: string, matchId: string, homeScore: number, awayScore: number, leagueId?: string): Promise<Prediction>;
    findAllByUser(userId: string): Promise<Prediction[]>;
}
