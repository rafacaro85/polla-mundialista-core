import { User } from './user.entity';
import { League } from './league.entity';
import { TransactionStatus } from '../enums/transaction-status.enum';
export declare class Transaction {
    id: string;
    amount: number;
    status: TransactionStatus;
    referenceCode: string;
    packageId?: string;
    user: User;
    createdAt: Date;
    league: League;
}
