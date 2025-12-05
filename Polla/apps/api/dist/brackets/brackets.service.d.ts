import { Repository } from 'typeorm';
import { UserBracket } from '../database/entities/user-bracket.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { SaveBracketDto } from './dto/save-bracket.dto';
export declare class BracketsService {
    private userBracketRepository;
    private matchRepository;
    private leagueParticipantRepository;
    constructor(userBracketRepository: Repository<UserBracket>, matchRepository: Repository<Match>, leagueParticipantRepository: Repository<LeagueParticipant>);
    saveBracket(userId: string, dto: SaveBracketDto): Promise<UserBracket>;
    getMyBracket(userId: string, leagueId?: string): Promise<UserBracket | null>;
    clearBracket(userId: string, leagueId?: string): Promise<void>;
    calculateBracketPoints(matchId: string, winnerTeamName: string): Promise<void>;
    recalculateAllBracketPoints(): Promise<void>;
}
