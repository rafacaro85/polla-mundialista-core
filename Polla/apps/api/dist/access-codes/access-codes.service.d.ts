import { Repository } from 'typeorm';
import { AccessCode } from '../database/entities/access-code.entity';
import { League } from '../database/entities/league.entity';
export declare class AccessCodesService {
    private accessCodeRepository;
    private leagueRepository;
    constructor(accessCodeRepository: Repository<AccessCode>, leagueRepository: Repository<League>);
    generateCodes(leagueId: string, quantity: number): Promise<AccessCode[]>;
    validateCode(code: string): Promise<AccessCode>;
}
