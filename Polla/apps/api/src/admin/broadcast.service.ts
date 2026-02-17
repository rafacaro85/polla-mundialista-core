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

  async broadcastEmail(subject: string, message: string, target: 'ALL' | 'NO_PREDICTION') {
    let users: User[] = [];

    if (target === 'ALL') {
      users = await this.userRepository.find({
        where: { isVerified: true },
      });
    } else if (target === 'NO_PREDICTION') {
      // Find users who have NOT made any prediction for UCL2526
      // Subquery to find users with predictions
      const usersWithPredictions = await this.predictionRepository
        .createQueryBuilder('p')
        .select('DISTINCT p."userId"', 'userId')
        .where('p.tournamentId = :tournamentId', { tournamentId: 'UCL2526' })
        .getRawMany();
      
      const excludedUserIds = usersWithPredictions.map(r => r.userId);

      const query = this.userRepository.createQueryBuilder('u')
        .where('u.isVerified = true');
      
      if (excludedUserIds.length > 0) {
        query.andWhere('u.id NOT IN (:...ids)', { ids: excludedUserIds });
      }

      users = await query.getMany();
    }

    this.logger.log(`📢 Starting broadcast to ${users.length} users (Target: ${target})`);

    // Chunk size: 50
    const CHUNK_SIZE = 50;
    const results = {
      total: users.length,
      sent: 0,
      failed: 0,
    };

    for (let i = 0; i < users.length; i += CHUNK_SIZE) {
      const chunk = users.slice(i, i + CHUNK_SIZE);
      const promises = chunk.map(user => 
        this.mailService.sendEmail(user.email, subject, message)
          .then((res: any) => {
            if (res.success) results.sent++;
            else results.failed++;
          })
          .catch((err: any) => {
            this.logger.error(`Error sending broadcast to ${user.email}: ${err.message}`);
            results.failed++;
          })
      );

      await Promise.all(promises);
      this.logger.log(`   -> Progressive: ${results.sent} sent, ${results.failed} failed...`);
    }

    this.logger.log(`✅ Broadcast finished. Sent: ${results.sent}, Failed: ${results.failed}`);
    return results;
  }
}
