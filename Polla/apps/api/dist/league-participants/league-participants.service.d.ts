import { DataSource, Repository } from 'typeorm';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { AccessCode } from '../database/entities/access-code.entity';
export declare class LeagueParticipantsService {
    private leagueParticipantRepository;
    private userRepository;
    private leagueRepository;
    private accessCodeRepository;
    private dataSource;
    constructor(leagueParticipantRepository: Repository<LeagueParticipant>, userRepository: Repository<User>, leagueRepository: Repository<League>, accessCodeRepository: Repository<AccessCode>, dataSource: DataSource);
    joinLeague(userId: string, code: string): Promise<LeagueParticipant>;
    removeParticipant(leagueId: string, userIdToRemove: string, requesterId: string, requesterRole: string): Promise<{
        message: string;
    }>;
    toggleBlockParticipant(leagueId: string, userIdToBlock: string, requesterId: string, requesterRole: string): Promise<{
        message: string;
        isBlocked: boolean;
    }>;
    assignTriviaPoints(leagueId: string, userId: string, points: number, requesterId: string, requesterRole: string): Promise<{
        message: string;
        totalTriviaPoints: number;
    }>;
}
