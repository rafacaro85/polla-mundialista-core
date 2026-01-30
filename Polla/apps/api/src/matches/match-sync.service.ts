import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { ScoringService } from '../scoring/scoring.service';
import { TournamentService } from '../tournament/tournament.service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class MatchSyncService {
    private readonly logger = new Logger(MatchSyncService.name);

    constructor(
        private readonly httpService: HttpService,
        @InjectRepository(Match)
        private readonly matchesRepository: Repository<Match>,
        private readonly scoringService: ScoringService,
        private readonly tournamentService: TournamentService,
    ) { }

    @Cron('*/1 * * * *') // Run every minute
    async syncLiveMatches() {
        try {
            const { data } = await firstValueFrom(
                this.httpService.get('/fixtures', {
                    params: { live: 'all' },
                }),
            );

            const fixtures = data.response;
            if (!fixtures || fixtures.length === 0) {
                return;
            }

            let updatedCount = 0;
            for (const fixture of fixtures) {
                const wasUpdated = await this.processFixtureData(fixture);
                if (wasUpdated) updatedCount++;
            }

            if (updatedCount > 0) {
                this.logger.log(`Sincronización completada. ${updatedCount} partidos actualizados.`);
            }

        } catch (error) {
            this.logger.error('Error sincronizando partidos', error);
        }
    }

    // Método público para simulación o webhook
    async processFixtureData(fixture: any): Promise<boolean> {
        try {
            const externalId = fixture.fixture.id;
            const statusShort = fixture.fixture.status.short;
            const homeScore = fixture.goals.home;
            const awayScore = fixture.goals.away;

            // Find match in our DB
            const match = await this.matchesRepository.findOne({ where: { externalId } });

            if (!match) {
                return false; // Match not tracked
            }

            if (match.isManuallyLocked) {
                this.logger.log(`Partido ${match.id} (Ext: ${externalId}) está bloqueado manualmente. Saltando.`);
                return false;
            }

            // Detectar cambios o necesidad de restaurar nombres/banderas
            const needsNames = !match.homeTeam || !match.awayTeam || !match.homeFlag || !match.awayFlag;
            const hasChanged = match.homeScore !== homeScore || match.awayScore !== awayScore || match.status !== 'COMPLETED' || needsNames;

            if (!hasChanged) return false;

            // Update teams/flags if missing
            if (needsNames) {
                match.homeTeam = fixture.teams.home.name;
                match.awayTeam = fixture.teams.away.name;
                match.homeFlag = fixture.teams.home.logo;
                match.awayFlag = fixture.teams.away.logo;
            }

            // Update scores
            match.homeScore = homeScore;
            match.awayScore = awayScore;

            // Check if match finished
            if (['FT', 'AET', 'PEN'].includes(statusShort)) {
                if (match.status !== 'FINISHED') {
                    match.status = 'FINISHED';
                    await this.matchesRepository.save(match);

                    this.logger.log(`Partido ${match.id} finalizado. Calculando puntos...`);
                    await this.scoringService.calculatePointsForMatch(match.id);

                    // Promote winner if it's a knockout match
                    await this.tournamentService.promoteToNextRound(match);
                }
            } else {
                // Update status to LIVE if not already
                if (match.status !== 'LIVE' && match.status !== 'COMPLETED') {
                    match.status = 'LIVE';
                }
                await this.matchesRepository.save(match);
            }

            return true;
        } catch (e) {
            this.logger.error(`Error procesando fixture ${fixture?.fixture?.id}`, e);
            return false;
        }
    }
}
