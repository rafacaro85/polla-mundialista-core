import { Repository, DataSource } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
export declare class TransactionsService {
    private transactionsRepository;
    private leaguesRepository;
    private dataSource;
    constructor(transactionsRepository: Repository<Transaction>, leaguesRepository: Repository<League>, dataSource: DataSource);
    createTransaction(user: User, amount: number, packageId: string, leagueId: string, status?: TransactionStatus): Promise<Transaction>;
    approveTransaction(id: string): Promise<Transaction>;
    findOne(id: string): Promise<Transaction | null>;
    findByLeagueId(leagueId: string): Promise<Transaction | null>;
    findAll(): Promise<Transaction[]>;
}
