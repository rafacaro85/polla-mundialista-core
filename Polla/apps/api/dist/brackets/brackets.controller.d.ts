import { Request } from 'express';
import { BracketsService } from './brackets.service';
import { SaveBracketDto } from './dto/save-bracket.dto';
export declare class BracketsController {
    private readonly bracketsService;
    constructor(bracketsService: BracketsService);
    saveBracket(req: Request & {
        user: any;
    }, dto: SaveBracketDto): unknown;
    getMyBracket(req: Request & {
        user: any;
    }): unknown;
    getMyBracketForLeague(req: Request & {
        user: any;
    }, leagueId: string): unknown;
    clearMyBracket(req: Request & {
        user: any;
    }): unknown;
    recalculatePoints(): unknown;
}
