import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications.service';
import { Prediction } from '../../database/entities/prediction.entity';
import { NotificationType } from '../../database/entities/notification.entity';

export class PhaseCompletedEvent {
  constructor(
    public readonly phase: string,
    public readonly tournamentId: string,
  ) {}
}

@Injectable()
export class PhaseCompletedListener {
  private readonly logger = new Logger(PhaseCompletedListener.name);

  constructor(
    private notificationsService: NotificationsService,
    @InjectRepository(Prediction)
    private predictionsRepository: Repository<Prediction>,
  ) {}

  @OnEvent('phase.completed', { async: true })
  async handlePhaseCompleted(event: PhaseCompletedEvent) {
    const { phase, tournamentId } = event;
    this.logger.log(
      `🏁 Processing Phase Completion for: ${phase} (${tournamentId})`,
    );

    try {
      // Aggregate query to get performance stats per user for this phase
      // Isolated by tournamentId
      const stats = await this.predictionsRepository
        .createQueryBuilder('p')
        .select('p.userId', 'userId')
        .addSelect('SUM(p.points)', 'totalPoints')
        .addSelect('COUNT(CASE WHEN p.points > 0 THEN 1 END)', 'hits')
        .leftJoin('p.match', 'm')
        .where('m.phase = :phase', { phase })
        .andWhere('m.tournamentId = :tournamentId', { tournamentId })
        .andWhere('p.leagueId IS NULL') // GLOBAL PREDICTIONS ONLY (Prevent duplicates per league)
        .groupBy('p.userId')
        .getRawMany();

      if (stats.length === 0) {
        this.logger.log(
          `ℹ️ No predictions found for phase ${phase}. Skipping notifications.`,
        );
        return;
      }

      this.logger.log(
        `📊 Found stats for ${stats.length} users in phase ${phase}. Generating notifications...`,
      );

      // Generate notifications
      // We can batch this or do it in loop. Since create() is one DB call, doing it in loop
      // is okay for < 1000 users. For more, we should use bulk insert.
      // NotificationsService.create is single insert.
      // Let's manually implement bulk insert here or improve service.
      // For now, loop with Promise.all in chunks is safer.

      // Dictionary for readable phase names
      const PHASE_NAMES: { [key: string]: string } = {
        GROUP: 'Fase de Grupos',
        ROUND_32: 'Dieciseisavos de Final',
        ROUND_16: 'Octavos de Final',
        QUARTER: 'Cuartos de Final',
        SEMI: 'Semifinales',
        '3RD_PLACE': 'Tercer Puesto',
        FINAL: 'Gran Final',
      };

      const phaseName = PHASE_NAMES[phase] || `Fase ${phase}`;

      // Determine tournament name for clear messaging
      const tournamentName =
        tournamentId === 'WC2026'
          ? 'Mundial 2026'
          : tournamentId === 'UCL2526'
            ? 'Champions League'
            : 'Torneo';

      const notificationsData = stats.map((stat) => {
        const points = parseInt(stat.totalPoints) || 0;
        const hits = parseInt(stat.hits) || 0;

        return {
          userId: stat.userId,
          title: `${tournamentName}: ${phaseName} Finalizada 🏁`,
          message: `La ${phaseName} del ${tournamentName} ha terminado. ✅ Tuviste ${hits} aciertos y sumaste ${points} puntos en esta ronda. ¡Mira tu posición en el ranking!`,
          type: NotificationType.INFO,
        };
      });

      // Re-use the bulk insert logic from service or access repository efficiently.
      // Since we injected NotificationsService, let's use a batch helper if available,
      // or just iterate.
      // I'll assume < 200 users for now and iterate, but parallelized.

      const chunkSize = 100;
      for (let i = 0; i < notificationsData.length; i += chunkSize) {
        const chunk = notificationsData.slice(i, i + chunkSize);
        await Promise.all(
          chunk.map((n) =>
            this.notificationsService.create(
              n.userId,
              n.title,
              n.message,
              n.type,
            ),
          ),
        );
      }

      this.logger.log(
        `✅ Sent ${notificationsData.length} notifications for phase ${phase}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Error processing phase completed notification: ${error.message}`,
        error.stack,
      );
    }
  }
}
