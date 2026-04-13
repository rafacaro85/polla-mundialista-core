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
import { LeagueStatus } from '../database/enums/league-status.enum';

import axios from 'axios';
import { TelegramService } from '../telegram/telegram.service';

// ── Plan Configuration (centralized) ──────────────────────────────────────────
export const PLAN_CONFIG: Record<string, { maxParticipants: number; price: number; type: 'SOCIAL' | 'ENTERPRISE' }> = {
  // Social
  'familia':    { maxParticipants: 5,   price: 0,       type: 'SOCIAL' },
  'parche':     { maxParticipants: 15,  price: 30000,   type: 'SOCIAL' },
  'amigos':     { maxParticipants: 50,  price: 80000,   type: 'SOCIAL' },
  'lider':      { maxParticipants: 100, price: 180000,  type: 'SOCIAL' },
  'influencer': { maxParticipants: 200, price: 350000,  type: 'SOCIAL' },
  // Empresarial
  'bronce':     { maxParticipants: 25,  price: 100000,  type: 'ENTERPRISE' },
  'plata':      { maxParticipants: 50,  price: 175000,  type: 'ENTERPRISE' },
  'oro':        { maxParticipants: 150, price: 450000,  type: 'ENTERPRISE' },
  'platino':    { maxParticipants: 300, price: 750000,  type: 'ENTERPRISE' },
  'diamante':   { maxParticipants: 500, price: 1000000, type: 'ENTERPRISE' },
  // Match
  'match_basico': { maxParticipants: 20, price: 15000, type: 'MATCH' },
  'match_pro': { maxParticipants: 50, price: 25000, type: 'MATCH' },
  'match_premium': { maxParticipants: 100, price: 35000, type: 'MATCH' },
  'match_evento': { maxParticipants: 300, price: 60000, type: 'MATCH' },
  // Legacy
  'starter': { maxParticipants: 5,   price: 0,      type: 'SOCIAL' },
  'FREE':    { maxParticipants: 5,   price: 0,      type: 'SOCIAL' },
  'amateur': { maxParticipants: 15,  price: 30000,  type: 'SOCIAL' },
  'semi-pro':{ maxParticipants: 50,  price: 80000,  type: 'SOCIAL' },
  'pro':     { maxParticipants: 100, price: 180000, type: 'SOCIAL' },
  'elite':   { maxParticipants: 200, price: 350000, type: 'SOCIAL' },
  'legend':  { maxParticipants: 300, price: 350000, type: 'SOCIAL' },
  'enterprise_launch':   { maxParticipants: 25,  price: 100000,  type: 'ENTERPRISE' },
  'enterprise_bronze':   { maxParticipants: 25,  price: 100000,  type: 'ENTERPRISE' },
  'enterprise_silver':   { maxParticipants: 50,  price: 175000,  type: 'ENTERPRISE' },
  'enterprise_gold':     { maxParticipants: 150, price: 450000,  type: 'ENTERPRISE' },
  'enterprise_platinum': { maxParticipants: 300, price: 750000,  type: 'ENTERPRISE' },
  'enterprise_diamond':  { maxParticipants: 500, price: 1000000, type: 'ENTERPRISE' },
};

export const FREE_PLANS = ['familia', 'starter', 'FREE', 'launch_promo', 'ENTERPRISE_LAUNCH'];

export function getPlanConfig(planKey: string | undefined | null) {
  if (!planKey) return PLAN_CONFIG['familia'];
  return PLAN_CONFIG[planKey.trim()] || PLAN_CONFIG[planKey.trim().toLowerCase()] || null;
}

  
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
      leagueId: string | null,
      tournamentId: string = DEFAULT_TOURNAMENT_ID,
      status: TransactionStatus = TransactionStatus.PENDING,
    ): Promise<Transaction> {
      let league: League | undefined = undefined;
      if (leagueId) {
        league = (await this.leaguesRepository.findOne({
          where: { id: leagueId },
        })) || undefined;
        if (!league) {
          throw new NotFoundException('Liga no encontrada');
        }
      }
  
      const transaction = this.transactionsRepository.create({
        user,
        amount,
        packageId, // This stores the package type (e.g., 'gold', 'platinum')
        league,
        status,
        tournamentId: league?.tournamentId || tournamentId,
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
      isUpgrade: boolean = false,
      upgradePlan?: string,
      currentPlan?: string,
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
        tournamentId: league?.tournamentId || tournamentId,
        league, // Attach league if found
        packageId: isUpgrade ? upgradePlan : league?.packageType,
        status: TransactionStatus.PENDING,
        referenceCode:
          referenceCode ||
          `TX-${leagueId ? 'LEAGUE' : 'USER'}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        isUpgrade,
        upgradePlan: upgradePlan || undefined,
        currentPlan: currentPlan || league?.packageType || undefined,
      });
  
      const saved = await this.transactionsRepository.save(transaction);
  
      // 📣 Notify admin via n8n Webhook for Telegram Interactive Approval
      try {
        await axios.post('https://primary-production-28ab1.up.railway.app/webhook/pago-recibido', {
          nombre_usuario: user.fullName || user.email,
          monto: `$${amount.toLocaleString('es-CO')}`,
          url_comprobante: imageUrl,
          id_pago: saved.id,
        });
      } catch (error) {
        console.error('❌ Error llamando al Webhook de n8n para pago:', error.message);
        // Fallback a notificación de texto directo temporal si falla n8n
        this.telegramService
          .notifyPayment(
            amount,
            user.email,
            league?.packageType,
            user.phoneNumber,
            user.fullName,
          )
          .catch((e) => console.error('Telegram Fallback Error:', e));
      }

    // 🔄 Si el participante tenía estado REJECTED, resetear a PENDING
    if (league) {
      const participant = await this.leagueParticipantsRepository.findOne({
        where: {
          league: { id: league.id },
          user: { id: user.id },
        },
      });

      if (participant && (
        participant.status === LeagueParticipantStatus.REJECTED ||
        participant.status === LeagueParticipantStatus.PENDING_PAYMENT
      )) {
        participant.status = LeagueParticipantStatus.PENDING;
        participant.isPaid = false;
        await this.leagueParticipantsRepository.save(participant);
        console.log(
          `🔄 Participant status reset to PENDING for league ${league.id}`,
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


        const targetPlanKey = transaction.isUpgrade
          ? transaction.upgradePlan
          : transaction.packageId;

        const planCfg = getPlanConfig(targetPlanKey);
        if (planCfg) {
          league.maxParticipants = planCfg.maxParticipants;
          league.packageType = targetPlanKey || 'familia';
        } else {

          league.packageType = targetPlanKey || league.packageType || 'familia';
        }

        league.isPaid = true;
        league.status = LeagueStatus.ACTIVE;

        if (transaction.isUpgrade) {
          console.log(`⬆️ [UPGRADE] Liga ${league.id}: ${transaction.currentPlan} → ${transaction.upgradePlan} (max: ${league.maxParticipants})`);
        }


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
