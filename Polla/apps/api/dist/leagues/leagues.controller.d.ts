import { LeaguesService } from './leagues.service';
import { CreateLeagueDto } from './dto/create-league.dto';
import { UpdateLeagueDto } from './dto/update-league.dto';
import { TransferOwnerDto } from './dto/transfer-owner.dto';
import type { Request } from 'express';
import { AccessCodesService } from '../access-codes/access-codes.service';
import { LeagueParticipantsService } from '../league-participants/league-participants.service';
import { GenerateAccessCodesDto } from './dto/generate-access-codes.dto';
import { JoinLeagueDto } from './dto/join-league.dto';
export declare class LeaguesController {
    private readonly leaguesService;
    private readonly accessCodesService;
    private readonly leagueParticipantsService;
    constructor(leaguesService: LeaguesService, accessCodesService: AccessCodesService, leagueParticipantsService: LeagueParticipantsService);
    createLeague(req: Request, createLeagueDto: CreateLeagueDto): Promise<import("../database/entities/league.entity").League>;
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
    getMyLeagues(req: Request): Promise<{
        id: string;
        name: string;
        code: string | undefined;
        isAdmin: boolean;
        creatorName: string;
        participantCount: number;
    }[]>;
    getLeagueMetadata(leagueId: string): Promise<{
        league: import("../database/entities/league.entity").League;
        availableSlots: number;
    }>;
    previewLeague(code: string): Promise<{
        id: string;
        name: string;
        brandingLogoUrl: string | undefined;
        prizeImageUrl: string | undefined;
        prizeDetails: string | undefined;
        welcomeMessage: string | undefined;
        creatorName: string;
    }>;
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
    getLeagueVoucher(leagueId: string, res: any): Promise<void>;
    generateCodes(leagueId: string, generateAccessCodesDto: GenerateAccessCodesDto, req: Request): Promise<import("../database/entities/access-code.entity").AccessCode[]>;
    getAllLeagues(): Promise<{
        id: string;
        name: string;
        code: string | undefined;
        type: import("../database/enums/league-type.enum").LeagueType;
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
    updateLeague(leagueId: string, updateLeagueDto: UpdateLeagueDto, req: Request): Promise<import("../database/entities/league.entity").League>;
    toggleBlockStatus(leagueId: string, req: Request): Promise<import("../database/entities/league.entity").League>;
    deleteLeague(leagueId: string, req: Request): Promise<{
        message: string;
    }>;
    transferOwner(leagueId: string, transferOwnerDto: TransferOwnerDto, req: Request): Promise<{
        message: string;
        id: string;
        name: string;
        organization?: import("../database/entities/organization.entity").Organization;
        type: import("../database/enums/league-type.enum").LeagueType;
        accessCodePrefix?: string;
        creator: import("../database/entities/user.entity").User;
        maxParticipants: number;
        status: import("../database/enums/league-status.enum").LeagueStatus;
        isPaid: boolean;
        packageType: string;
        brandingLogoUrl?: string;
        prizeDetails?: string;
        prizeImageUrl?: string;
        welcomeMessage?: string;
        participants: import("../database/entities/league-participant.entity").LeagueParticipant[];
        accessCodes: import("../database/entities/access-code.entity").AccessCode[];
    }>;
    removeParticipant(leagueId: string, userId: string, req: Request): Promise<{
        message: string;
    }>;
    toggleBlockParticipant(leagueId: string, userId: string, req: Request): Promise<{
        message: string;
        isBlocked: boolean;
    }>;
    joinLeague(req: Request, joinLeagueDto: JoinLeagueDto): Promise<import("../database/entities/league-participant.entity").LeagueParticipant>;
}
