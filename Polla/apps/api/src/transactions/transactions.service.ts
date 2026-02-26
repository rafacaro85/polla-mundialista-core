import { Injectable, NotFoundException } from '@nestjs/common';
import { DEFAULT_TOURNAMENT_ID } from '../common/constants/tournament.constants';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, IsNull } from 'typeorm';
import { Transaction } from '../database/entities/transaction.entity';
import { User } from '../database/entities/user.entity';
import { League } from '../database/entities/league.entity';
import { TransactionStatus } from '../database/enums/transaction-status.enum';
import { LeagueType } from '../database/enums/league-type.enum';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { LeagueParticipantStatus } from '../database/enums/league-participant-status.enum';

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
    @InjectRepository(LeagueParticipant)
    private leagueParticipantsRepository: Repository<LeagueParticipant>,
    private dataSource: DataSource,
    private telegramService: TelegramService,
  ) {}

  async createTransaction(
    user: User,
    amount: number,
    packageId: string,
    leagueId: string,
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
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
      tournamentId,
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
    tournamentId: string = DEFAULT_TOURNAMENT_ID,
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
      tournamentId,
      league, // Attach league if found
      packageId: league?.packageType,
      status: TransactionStatus.PENDING,
      referenceCode:
        referenceCode ||
        `TX-${leagueId ? 'LEAGUE' : 'USER'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    });

    // 📣 Notify admin via Telegram
    this.telegramService
      .notifyPayment(
        amount,
        user.email,
        league?.packageType,
        user.phoneNumber,
        user.fullName,
      )
      .catch((e) => console.error('Telegram Error:', e));

    const saved = await this.transactionsRepository.save(transaction);

    // 🔄 Si el participante tenía estado REJECTED, resetear a PENDING
    if (league) {
      const participant = await this.leagueParticipantsRepository.findOne({
        where: {
          league: { id: league.id },
          user: { id: user.id },
        },
      });

      if (
        participant &&
        participant.status === LeagueParticipantStatus.REJECTED
      ) {
        participant.status = LeagueParticipantStatus.PENDING;
        participant.isPaid = false;
        await this.leagueParticipantsRepository.save(participant);
        console.log(
          `🔄 Participant status reset from REJECTED to PENDING for league ${league.id}`,
        );
      }
    }

    return saved;
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

    console.log(`[TransactionsService] updateStatus called for ${id} with status ${status}`);
    
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

        // ✅ Activate participant who made the payment
        const participant = await this.leagueParticipantsRepository.findOne({
          where: {
            league: { id: league.id },
            user: { id: transaction.user.id },
          },
        });
        if (participant) {
          participant.status = LeagueParticipantStatus.ACTIVE;
          participant.isPaid = true;
          await queryRunner.manager.save(participant);
          console.log(
            `✅ Participant ${transaction.user.id} activated for league ${league.id}`,
          );
        }
      }

      // Handle REJECTED Transaction (Update participant status)
      if (status === TransactionStatus.REJECTED) {
        console.log(`[TransactionsService] ❌ Rejecting transaction ${transaction.id}`);
        
        // Use IDs directly to avoid issues with relation hydration
        const leagueId = transaction.league?.id;
        const userId = transaction.user?.id;

        if (leagueId && userId) {
          console.log(`[TransactionsService] Found league ${leagueId} and user ${userId} for rejection`);
          const participant = await this.leagueParticipantsRepository.findOne({
            where: {
              league: { id: leagueId },
              user: { id: userId },
            },
          });

          if (participant) {
            participant.status = LeagueParticipantStatus.REJECTED;
            participant.isPaid = false;
            await queryRunner.manager.save(participant);
            console.log(`[TransactionsService] ✅ Participant status updated to REJECTED for user ${userId} in league ${leagueId}`);
          } else {
            console.warn(`[TransactionsService] ⚠️ Participant record not found for rejection (League: ${leagueId}, User: ${userId})`);
          }
        } else {
          console.warn(`[TransactionsService] ⚠️ Transaction missing league (${leagueId}) or user (${userId}) for rejection logic`);
        }
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

  async findPending(tournamentId?: string): Promise<Transaction[]> {
    const where: any = { status: TransactionStatus.PENDING };
    if (tournamentId) {
      where.tournamentId = tournamentId;
    }
    return this.transactionsRepository.find({
      where,
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAll(tournamentId?: string): Promise<Transaction[]> {
    const where: any = {};
    if (tournamentId) {
      where.tournamentId = tournamentId;
    }
    return this.transactionsRepository.find({
      where,
      relations: ['user', 'league'],
      order: { createdAt: 'DESC' },
    });
  }
}
