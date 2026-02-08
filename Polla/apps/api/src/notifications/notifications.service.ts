import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import {
  Notification,
  NotificationType,
} from '../database/entities/notification.entity';
import { User } from '../database/entities/user.entity';
import { UserRole } from '../database/enums/user-role.enum';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(
    userId: string,
    title: string,
    message: string,
    type: NotificationType = NotificationType.INFO,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      userId,
      title,
      message,
      type,
    });
    return this.notificationsRepository.save(notification);
  }

  async findAll(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC', isRead: 'ASC' },
      take: 50, // Limit to last 50 to avoid clutter
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async broadcast(
    title: string,
    message: string,
    type: NotificationType,
    targetAudience: 'ALL' | 'FREE' | 'PAID',
    tournamentId?: string,
  ): Promise<number> {
    this.logger.log(
      `📢 Starting broadcast: "${title}" to ${targetAudience} (Tournament: ${tournamentId || 'ALL'})`,
    );

    let users: { id: string }[] = [];

    if (tournamentId) {
      // Filter users participating in leagues of this tournament
      const query = this.usersRepository
        .createQueryBuilder('u')
        .select('DISTINCT u.id', 'id')
        .innerJoin('u.leagueParticipants', 'lp')
        .innerJoin('lp.league', 'l')
        .where('l.tournamentId = :tournamentId', { tournamentId });

      if (targetAudience === 'PAID') {
        query.andWhere('u.hasPaid = :paid', { paid: true });
      } else if (targetAudience === 'FREE') {
        query.andWhere('u.hasPaid = :paid', { paid: false });
      }

      const rawUsers = await query.getRawMany();
      users = rawUsers.map((ru) => ({ id: ru.id }));
    } else {
      // Global case
      let whereCondition = {};
      if (targetAudience === 'PAID') {
        whereCondition = { hasPaid: true };
      } else if (targetAudience === 'FREE') {
        whereCondition = { hasPaid: false };
      }

      users = await this.usersRepository.find({
        select: ['id'],
        where: whereCondition,
      });
    }

    if (users.length === 0) return 0;

    const notifications = users.map((user) =>
      this.notificationsRepository.create({
        userId: user.id,
        title,
        message,
        type,
      }),
    );

    // Batch save
    const chunkSize = 500;
    for (let i = 0; i < notifications.length; i += chunkSize) {
      await this.notificationsRepository.save(
        notifications.slice(i, i + chunkSize),
      );
    }

    this.logger.log(`✅ Broadcast sent to ${users.length} users.`);
    return users.length;
  }
}
