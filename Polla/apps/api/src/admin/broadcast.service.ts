import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Prediction)
    private readonly predictionRepository: Repository<Prediction>,
    private readonly mailService: MailService,
  ) {}

  async broadcastEmail(
    subject: string,
    message: string,
    target:
      | 'ALL'
      | 'NO_PREDICTION'
      | 'NO_BRACKET'
      | 'FREE_BRACKET'
      | 'PAID_BRACKET',
    tournamentId: string = 'UCL2526',
  ) {
    let users: User[] = [];

    const query = this.userRepository
      .createQueryBuilder('u')
      .where('u.isVerified = true');

    if (target === 'ALL') {
      users = await query.getMany();
    } else if (target === 'NO_PREDICTION') {
      // Users with no predictions for this tournament
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('p.userId')
            .from(Prediction, 'p')
            .where('p.tournamentId = :tournamentId')
            .getQuery();
          return 'u.id NOT IN ' + subQuery;
        })
        .setParameter('tournamentId', tournamentId);

      users = await query.getMany();
    } else if (target === 'NO_BRACKET') {
      // Users who NOT participate in any league for this tournament
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('lp.userId')
            .from('league_participants', 'lp')
            .innerJoin('leagues', 'l', 'lp.leagueId = l.id')
            .where('l.tournamentId = :tournamentId')
            .getQuery();
          return 'u.id NOT IN ' + subQuery;
        })
        .setParameter('tournamentId', tournamentId);

      users = await query.getMany();
    } else if (target === 'PAID_BRACKET') {
      // Users in at least one paid league for this tournament
      query
        .andWhere((qb) => {
          const subQuery = qb
            .subQuery()
            .select('lp.userId')
            .from('league_participants', 'lp')
            .innerJoin('leagues', 'l', 'lp.leagueId = l.id')
            .where('l.tournamentId = :tournamentId')
            .andWhere('l.isPaid = true')
            .getQuery();
          return 'u.id IN ' + subQuery;
        })
        .setParameter('tournamentId', tournamentId);

      users = await query.getMany();
    } else if (target === 'FREE_BRACKET') {
      // Users in at least one free league AND NOT in any paid league for this tournament
      query
        .andWhere((qb) => {
          const subQueryFree = qb
            .subQuery()
            .select('lp.userId')
            .from('league_participants', 'lp')
            .innerJoin('leagues', 'l', 'lp.leagueId = l.id')
            .where('l.tournamentId = :tournamentId')
            .andWhere('l.isPaid = false')
            .getQuery();
          return 'u.id IN ' + subQueryFree;
        })
        .andWhere((qb) => {
          const subQueryPaid = qb
            .subQuery()
            .select('lp.userId')
            .from('league_participants', 'lp')
            .innerJoin('leagues', 'l', 'lp.leagueId = l.id')
            .where('l.tournamentId = :tournamentId')
            .andWhere('l.isPaid = true')
            .getQuery();
          return 'u.id NOT IN ' + subQueryPaid;
        })
        .setParameter('tournamentId', tournamentId);

      users = await query.getMany();
    }

    this.logger.log(
      `📢 Starting broadcast to ${users.length} users (Target: ${target})`,
    );

    // Chunk size: 50
    const CHUNK_SIZE = 50;
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
    };

    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map((user) =>
        this.mailService
          .sendEmail(user.email, subject, message)
          .then((res: any) => {
            if (res.success) results.sent++;
            else results.failed++;
          })
          .catch((err: any) => {
            this.logger.error(
              `Error sending broadcast to ${user.email}: ${err.message}`,
            );
            results.failed++;
          }),
      );

      await Promise.all(promises);
      this.logger.log(
        `   -> Progressive: ${results.sent} sent, ${results.failed} failed...`,
      );
    }

    this.logger.log(
      `✅ Broadcast finished. Sent: ${results.sent}, Failed: ${results.failed}`,
    );
    return results;
  }
}
