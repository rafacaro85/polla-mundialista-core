import { Repository } from 'typeorm';
import { League } from '../database/entities/league.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { LeagueType } from '../database/enums/league-type.enum';
import { LeagueStatus } from '../database/enums/league-status.enum';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { TransactionsService } from '../transactions/transactions.service';
import { PdfService } from '../common/pdf/pdf.service';
export declare class LeaguesService {
    private leaguesRepository;
    private leagueParticipantsRepository;
    private userRepository;
    private transactionsService;
    private pdfService;
    constructor(leaguesRepository: Repository<League>, leagueParticipantsRepository: Repository<LeagueParticipant>, userRepository: Repository<User>, transactionsService: TransactionsService, pdfService: PdfService);
    createLeague(userId: string, createLeagueDto: CreateLeagueDto): Promise<League>;
    private generateCode;
    getMetadata(leagueId: string): Promise<{
        league: League;
        availableSlots: number;
    }>;
    getLeagueByCode(code: string): Promise<{
        id: string;
        name: string;
        brandingLogoUrl: string | undefined;
        prizeImageUrl: string | undefined;
        prizeDetails: string | undefined;
        welcomeMessage: string | undefined;
        creatorName: string;
    }>;
    getGlobalRanking(): Promise<{
        position: number;
        id: any;
        nickname: any;
        avatarUrl: any;
        predictionPoints: number;
        bracketPoints: number;
        bonusPoints: number;
        totalPoints: number;
    }[]>;
    getMyLeagues(userId: string): Promise<{
        id: string;
        name: string;
        code: string | undefined;
        isAdmin: boolean;
        creatorName: string;
        participantCount: number;
    }[]>;
    getLeagueRanking(leagueId: string): Promise<{
        position: number;
        id: any;
        nickname: any;
        avatarUrl: any;
        predictionPoints: number;
        bracketPoints: number;
        bonusPoints: number;
        triviaPoints: number;
        totalPoints: number;
    }[]>;
    getAllLeagues(): Promise<{
        id: string;
        name: string;
        code: string | undefined;
        type: LeagueType;
        maxParticipants: number;
        creator: {
            id: string;
            nickname: string;
            avatarUrl: string | undefined;
        };
        participantCount: number;
        brandingLogoUrl: string | undefined;
        prizeImageUrl: string | undefined;
        prizeDetails: string | undefined;
        welcomeMessage: string | undefined;
    }[]>;
    updateLeague(leagueId: string, userId: string, updateLeagueDto: UpdateLeagueDto, userRole: string): Promise<League>;
    transferOwner(leagueId: string, requesterId: string, newAdminId: string, requesterRole: string): Promise<{
        message: string;
        id: string;
        name: string;
        organization?: import("../database/entities/organization.entity").Organization;
        type: LeagueType;
        accessCodePrefix?: string;
        creator: User;
        maxParticipants: number;
        status: LeagueStatus;
        isPaid: boolean;
        packageType: string;
        brandingLogoUrl?: string;
        prizeDetails?: string;
        prizeImageUrl?: string;
        welcomeMessage?: string;
        participants: LeagueParticipant[];
        accessCodes: import("../database/entities/access-code.entity").AccessCode[];
    }>;
    deleteLeague(leagueId: string, userId: string, userRole: string): Promise<{
        message: string;
    }>;
    toggleBlockStatus(leagueId: string, userId: string, userRole: string): Promise<League>;
    getLeagueVoucher(leagueId: string): Promise<Buffer>;
}
