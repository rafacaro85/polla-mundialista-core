import { Repository } from 'typeorm';
import { League } from '../database/entities/league.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
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
    getLeagueByCode(code: string): unknown;
    getGlobalRanking(): unknown;
    getMyLeagues(userId: string): unknown;
    getLeagueRanking(leagueId: string): unknown;
    getAllLeagues(): unknown;
    updateLeague(leagueId: string, userId: string, updateLeagueDto: UpdateLeagueDto, userRole: string): unknown;
    transferOwner(leagueId: string, requesterId: string, newAdminId: string, requesterRole: string): unknown;
    deleteLeague(leagueId: string, userId: string, userRole: string): unknown;
    toggleBlockStatus(leagueId: string, userId: string, userRole: string): unknown;
    getLeagueVoucher(leagueId: string): Promise<Buffer>;
}
