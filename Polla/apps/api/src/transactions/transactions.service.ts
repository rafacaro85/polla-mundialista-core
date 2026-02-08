import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { LeagueType } from '../database/enums/league-type.enum';

import { TelegramService } from '../telegram/telegram.service';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionsRepository: Repository<Transaction>,
    @InjectRepository(League)
    private leaguesRepository: Repository<League>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private dataSource: DataSource,
    private telegramService: TelegramService,
  ) {}

  async createTransaction(
    user: User,
    amount: number,
    packageId: string,
    leagueId: string,
    status: TransactionStatus = TransactionStatus.PENDING,
  ): Promise<Transaction> {
    const league = await this.leaguesRepository.findOne({
      where: { id: leagueId },
    });
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

  async uploadTransaction(
    user: User,
    imageUrl: string,
    amount: number = 50000,
    referenceCode?: string,
    leagueId?: string,
  ): Promise<Transaction> {
    let league: League | undefined = undefined;
    if (leagueId) {
      league =
        (await this.leaguesRepository.findOne({ where: { id: leagueId } })) ||
        undefined;
    }

    const transaction = this.transactionsRepository.create({
      user,
      amount,
      imageUrl,
      league, // Attach league if found
      packageId: league?.packageType,
      status: TransactionStatus.PENDING,
      referenceCode:
        referenceCode ||
        `TX-${leagueId ? 'LEAGUE' : 'USER'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });

    // 📢 Admin Alert (💰)
    this.telegramService
      .notifyPayment(
        amount,
        user.email,
        league?.packageType,
        user.phoneNumber,
        user.fullName,
      )
      .catch((e) => console.error('Telegram Error:', e));

    return this.transactionsRepository.save(transaction);
  }

  async updateStatus(
    id: string,
    status: TransactionStatus,
    adminNotes?: string,
  ): Promise<Transaction> {
    const transaction = await this.transactionsRepository.findOne({
      where: { id },
      relations: ['user', 'league'],
    });

    if (!transaction) {
      throw new NotFoundException('Transacción no encontrada');
    }

    if (transaction.status === status) {
      return transaction;
    }

    // Transactional operation
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      transaction.status = status;
      if (adminNotes) {
        transaction.adminNotes = adminNotes;
      }
      await queryRunner.manager.save(transaction);

      // Handle User Activation (Account Payment)
      if (
        status === TransactionStatus.APPROVED &&
        transaction.user &&
        !transaction.league
      ) {
        transaction.user.hasPaid = true;
        transaction.user.isVerified = true;
        await queryRunner.manager.save(transaction.user);
      }

      // Handle League Activation (if transaction is linked to a league)
      if (
        (status === TransactionStatus.APPROVED ||
          status === TransactionStatus.PAID) &&
        transaction.league
      ) {
        const league = transaction.league;
        let maxParticipants = league.maxParticipants;

        if (transaction.packageId) {
          switch (transaction.packageId) {
            case 'semi-pro':
              maxParticipants = 35;
              break;
            case 'pro':
              maxParticipants = 60;
              break;
            case 'elite':
              maxParticipants = 150;
              break;
            case 'legend':
              maxParticipants = 300;
              break;
            default:
              maxParticipants = league.maxParticipants;
          }
        }

        league.maxParticipants = maxParticipants;
        league.packageType = transaction.packageId || 'starter';
        league.isPaid = true;

        // Auto-activate Enterprise Mode if applicable
        if (league.type === LeagueType.COMPANY || league.isEnterprise) {
          league.isEnterpriseActive = true;
        }

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

  // Keep existing approveTransaction for backward compatibility if needed, or deprecate.
  // The existing controller uses approveTransaction. I'll redirect it to updateStatus(PAID) for now.
  async approveTransaction(id: string): Promise<Transaction> {
    return this.updateStatus(id, TransactionStatus.PAID);
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
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestAccountTransaction(
    userId: string,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: {
        user: { id: userId },
        league: IsNull(),
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findLatestLeagueTransaction(
    userId: string,
    leagueId: string,
  ): Promise<Transaction | null> {
    return this.transactionsRepository.findOne({
      where: {
        user: { id: userId },
        league: { id: leagueId },
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findPending(): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      where: { status: TransactionStatus.PENDING },
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(): Promise<Transaction[]> {
    return this.transactionsRepository.find({
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' },
    });
  }
}
