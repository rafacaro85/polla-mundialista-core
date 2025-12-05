import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { StandingsService } from '../standings/standings.service';
export declare class TournamentService {
    private matchesRepository;
    private standingsService;
    private readonly logger;
    constructor(matchesRepository: Repository<Match>, standingsService: StandingsService);
    isGroupComplete(group: string): Promise<boolean>;
    private getPlaceholderMapping;
    promoteFromGroup(group: string): Promise<void>;
    promoteAllCompletedGroups(): Promise<void>;
}
