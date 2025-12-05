import { Repository } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
export declare class TransactionsService {
    private transactionsRepository;
    constructor(transactionsRepository: Repository<Transaction>);
    createTransaction(user: User, amount: number, packageId: string, league: League, status?: TransactionStatus): Promise<Transaction>;
    findOne(id: string): Promise<Transaction | null>;
    findByLeagueId(leagueId: string): Promise<Transaction | null>;
    findAll(): Promise<Transaction[]>;
}
