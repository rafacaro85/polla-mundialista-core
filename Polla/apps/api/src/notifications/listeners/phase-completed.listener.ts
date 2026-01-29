import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications.service';
import { Prediction } from '../../database/entities/prediction.entity';
import { NotificationType } from '../../database/entities/notification.entity';

export class PhaseCompletedEvent {
    constructor(public readonly phase: string) {}
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
        const { phase } = event;
        this.logger.log(`🏁 Processing Phase Completion for: ${phase}`);

        try {
            // Aggregate query to get performance stats per user for this phase
            // Using QueryBuilder for efficient grouping
            const stats = await this.predictionsRepository.createQueryBuilder('p')
                .select('p.userId', 'userId')
                .addSelect('SUM(p.points)', 'totalPoints')
                .addSelect('COUNT(CASE WHEN p.points > 0 THEN 1 END)', 'hits')
                .leftJoin('p.match', 'm')
                .where('m.phase = :phase', { phase })
                .groupBy('p.userId')
                .getRawMany();

            if (stats.length === 0) {
                this.logger.log(`ℹ️ No predictions found for phase ${phase}. Skipping notifications.`);
                return;
            }

            this.logger.log(`📊 Found stats for ${stats.length} users in phase ${phase}. Generating notifications...`);

            // Generate notifications
            // We can batch this or do it in loop. Since create() is one DB call, doing it in loop 
            // is okay for < 1000 users. For more, we should use bulk insert.
            // NotificationsService.create is single insert. 
            // Let's manually implement bulk insert here or improve service.
            // For now, loop with Promise.all in chunks is safer.

            const notificationsData = stats.map(stat => {
                const points = parseInt(stat.totalPoints) || 0;
                const hits = parseInt(stat.hits) || 0;
                
                // Customize message based on performance?
                // Generic requested: "Fase {phase} finalizada. ✅ Tuviste {hits} aciertos y sumaste {points} puntos. ¡Mira tu posición en el ranking!"
                
                return {
                    userId: stat.userId,
                    title: `Fase ${phase} Finalizada 🏁`,
                    message: `La fase de grupos ha terminado. ✅ Tuviste ${hits} aciertos y sumaste ${points} puntos. ¡Mira tu posición en el ranking!`,
                    type: NotificationType.INFO
                };
            });

            // Re-use the bulk insert logic from service or access repository efficiently.
            // Since we injected NotificationsService, let's use a batch helper if available, 
            // or just iterate. 
            // I'll assume < 200 users for now and iterate, but parallelized.
            
            const chunkSize = 100;
            for (let i = 0; i < notificationsData.length; i += chunkSize) {
                const chunk = notificationsData.slice(i, i + chunkSize);
                await Promise.all(chunk.map(n => 
                    this.notificationsService.create(n.userId, n.title, n.message, n.type)
                ));
            }

            this.logger.log(`✅ Sent ${notificationsData.length} notifications for phase ${phase}`);

        } catch (error) {
            this.logger.error(`❌ Error processing phase completed notification: ${error.message}`, error.stack);
        }
    }
}
