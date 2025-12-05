import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { ScoringService } from '../scoring/scoring.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MatchSyncService {
    private readonly logger = new Logger(MatchSyncService.name);

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(Match)
        private readonly matchesRepository: Repository<Match>,
        private readonly scoringService: ScoringService,
    ) { }

    @Cron('*/1 * * * *') // Run every minute
    async syncLiveMatches() {
        this.logger.log('Sincronizando partidos en vivo...');
        try {
            const { data } = await firstValueFrom(
                this.httpService.get('/fixtures', {
                    params: { live: 'all' },
                }),
            );

            const fixtures = data.response;
            if (!fixtures || fixtures.length === 0) {
                this.logger.log('No hay partidos en vivo en este momento.');
                return;
            }

            let updatedCount = 0;

            for (const fixture of fixtures) {
                const externalId = fixture.fixture.id;
                const statusShort = fixture.fixture.status.short;
                const homeScore = fixture.goals.home;
                const awayScore = fixture.goals.away;

                // Find match in our DB
                const match = await this.matchesRepository.findOne({ where: { externalId } });

                if (!match) {
                    continue; // Match not tracked in our system
                }

                if (match.isLocked) {
                    this.logger.log(`Partido ${match.id} (Ext: ${externalId}) está bloqueado manualmente. Saltando.`);
                    continue;
                }

                // Update scores
                match.homeScore = homeScore;
                match.awayScore = awayScore;

                // Check if match finished
                if (['FT', 'AET', 'PEN'].includes(statusShort)) {
                    if (match.status !== 'COMPLETED') {
                        match.status = 'COMPLETED';
                        await this.matchesRepository.save(match);

                        this.logger.log(`Partido ${match.id} finalizado. Calculando puntos...`);
                        await this.scoringService.calculatePointsForMatch(match.id);
                    }
                } else {
                    // Update status to LIVE if not already
                    if (match.status !== 'LIVE' && match.status !== 'COMPLETED') {
                        match.status = 'LIVE';
                    }
                    await this.matchesRepository.save(match);
                }

                updatedCount++;
            }

            if (updatedCount > 0) {
                this.logger.log(`Sincronización completada. ${updatedCount} partidos actualizados.`);
            }

        } catch (error) {
            this.logger.error('Error sincronizando partidos', error);
        }
    }
}
