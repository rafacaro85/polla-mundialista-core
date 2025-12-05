import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { TransactionStatus } from '../database/enums/transaction-status.enum';

@Injectable()
export class TransactionsService {
    constructor(
        @InjectRepository(Transaction)
        private transactionsRepository: Repository<Transaction>,
        @InjectRepository(League)
        private leaguesRepository: Repository<League>,
        private dataSource: DataSource,
    ) { }

    async createTransaction(
        user: User,
        amount: number,
        packageId: string,
        leagueId: string,
        status: TransactionStatus = TransactionStatus.PENDING,
    ): Promise<Transaction> {
        const league = await this.leaguesRepository.findOne({ where: { id: leagueId } });
        if (!league) {
            throw new NotFoundException('Liga no encontrada');
        }

        const transaction = this.transactionsRepository.create({
            user,
            amount,
            packageId, // This stores the package type (e.g., 'gold', 'platinum')
            league,
            status,
            referenceCode: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        });

        return this.transactionsRepository.save(transaction);
    }

    async approveTransaction(id: string): Promise<Transaction> {
        const transaction = await this.transactionsRepository.findOne({
            where: { id },
            relations: ['league'],
        });

        if (!transaction) {
            throw new NotFoundException('Transacción no encontrada');
        }

        if (transaction.status === TransactionStatus.PAID) {
            return transaction; // Already approved
        }

        // Transactional operation
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // 1. Update Transaction Status
            transaction.status = TransactionStatus.PAID;
            await queryRunner.manager.save(transaction);

            // 2. Update League Limits
            if (transaction.league) {
                const league = transaction.league;
                let maxParticipants = 3; // Default

                switch (transaction.packageId) { // packageId holds the package type string
                    case 'starter': // Bronce
                        maxParticipants = 3;
                        break;
                    case 'amateur': // Plata
                        maxParticipants = 15;
                        break;
                    case 'semi-pro': // Oro
                        maxParticipants = 35;
                        break;
                    case 'pro': // Platino
                        maxParticipants = 60;
                        break;
                    case 'elite': // Diamante
                        maxParticipants = 150;
                        break;
                    case 'legend': // Esmeralda
                        maxParticipants = 300;
                        break;
                    default:
                        maxParticipants = league.maxParticipants; // Keep existing if unknown
                }

                league.maxParticipants = maxParticipants;
                league.packageType = transaction.packageId || 'starter';
                league.isPaid = true;

                await queryRunner.manager.save(league);
            }

            await queryRunner.commitTransaction();
            return transaction;

        } catch (err) {
            await queryRunner.rollbackTransaction();
            throw err;
        } finally {
            await queryRunner.release();
        }
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
