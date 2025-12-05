import { Request } from 'express';
import { BracketsService } from './brackets.service';
import { SaveBracketDto } from './dto/save-bracket.dto';
export declare class BracketsController {
    private readonly bracketsService;
    constructor(bracketsService: BracketsService);
    saveBracket(req: Request & {
        user: any;
    }, dto: SaveBracketDto): Promise<import("../database/entities/user-bracket.entity").UserBracket>;
    getMyBracket(req: Request & {
        user: any;
    }): Promise<import("../database/entities/user-bracket.entity").UserBracket | null>;
    getMyBracketForLeague(req: Request & {
        user: any;
    }, leagueId: string): Promise<import("../database/entities/user-bracket.entity").UserBracket | null>;
    clearMyBracket(req: Request & {
        user: any;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    recalculatePoints(): Promise<{
        message: string;
    }>;
}
