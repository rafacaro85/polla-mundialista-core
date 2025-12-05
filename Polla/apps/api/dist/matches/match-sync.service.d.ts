import { HttpService } from '@nestjs/axios';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { ScoringService } from '../scoring/scoring.service';
export declare class MatchSyncService {
    private readonly httpService;
    private readonly matchesRepository;
    private readonly scoringService;
    private readonly logger;
    constructor(httpService: HttpService, matchesRepository: Repository<Match>, scoringService: ScoringService);
    syncLiveMatches(): Promise<void>;
}
