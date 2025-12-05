import { League } from './league.entity';
import { AccessCodeStatus } from '../enums/access-code-status.enum';
import { User } from './user.entity';
export declare class AccessCode {
    id: string;
    code: string;
    league: League;
    status: AccessCodeStatus;
    usedBy?: User;
    createdAt: Date;
    usedAt?: Date;
}
