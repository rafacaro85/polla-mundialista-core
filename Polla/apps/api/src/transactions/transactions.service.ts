import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { TransactionStatus } from '../database/enums/transaction-status.enum';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
    ) { }

    async createTransaction(
        user: User,
        amount: number,
        packageId: string,
        league: League,
        status: TransactionStatus = TransactionStatus.PENDING,
    ): Promise<Transaction> {
        const transaction = this.transactionsRepository.create({
            user,
            amount,
            packageId,
            league,
            status,
            referenceCode: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        });

        return this.transactionsRepository.save(transaction);
    }

    async findOne(id: string): Promise<Transaction | null> {
        return this.transactionsRepository.findOne({
            where: { id },
            relations: ['user', 'league'],
        });
    }

    async findByLeagueId(leagueId: string): Promise<Transaction | null> {
        return this.transactionsRepository.findOne({
            where: { league: { id: leagueId } },
            relations: ['user', 'league'],
            order: { createdAt: 'DESC' }, // Get the latest one if multiple exist
        });
    }

    async findAll(): Promise<Transaction[]> {
        return this.transactionsRepository.find({
            relations: ['user', 'league'],
            order: { createdAt: 'DESC' },
        });
    }
}
