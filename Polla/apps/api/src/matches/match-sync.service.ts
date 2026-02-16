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
  ) {}

  @Cron('*/1 * * * *') // Run every minute
  async syncLiveMatches() {
    try {
      // SMART TIME-WINDOW FILTERING (API Quota Protection)
      const now = new Date();
      const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000); // 3 hours ago
      const windowEnd = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

      this.logger.log(
        `🕒 Smart Sync: Checking matches between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`,
      );

      // Query matches with externalId in time window
      const matches = await this.matchesRepository
        .createQueryBuilder('match')
        .where('match.externalId IS NOT NULL')
        .andWhere('match.status != :status', { status: 'FINISHED' })
        .andWhere('match.date BETWEEN :start AND :end', {
          start: windowStart,
          end: windowEnd,
        })
        .getMany();

      this.logger.log(
        `📊 Found ${matches.length} active match(es) to update.`,
      );

      if (matches.length === 0) {
        return;
      }

      let updatedCount = 0;
      for (const match of matches) {
        this.logger.log(
          `🔎 Checking Match: ${match.homeTeam} vs ${match.awayTeam} (External ID: ${match.externalId})`,
        );

        try {
          // Query specific fixture by ID
          const { data } = await firstValueFrom(
            this.httpService.get('/fixtures', {
              params: { id: match.externalId },
            }),
          );

          const fixtures = data.response;
          if (!fixtures || fixtures.length === 0) {
            this.logger.warn(
              `⚠️  Match not found in API (ID: ${match.externalId})`,
            );
            continue;
          }

          const fixture = fixtures[0];
          this.logger.log(
            `📡 API Response: Status=[${fixture.fixture.status.short}], Score=[${fixture.goals.home}-${fixture.goals.away}], Minute=[${fixture.fixture.status.elapsed || 'N/A'}']`,
          );

          const wasUpdated = await this.processFixtureData(fixture);
          if (wasUpdated) {
            updatedCount++;
            this.logger.log(
              `✅ Updated: ${match.homeTeam} vs ${match.awayTeam}`,
            );
          } else {
            this.logger.log(`ℹ️  No changes needed for match ${match.id}`);
          }
        } catch (error) {
          this.logger.error(
            `❌ Error fetching fixture ${match.externalId}:`,
            error.message,
          );
        }
      }

      if (updatedCount > 0) {
        this.logger.log(
          `🎉 Sincronización completada. ${updatedCount} partido(s) actualizado(s).`,
        );
      }
    } catch (error) {
      this.logger.error('💥 Error sincronizando partidos', error);
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
      const match = await this.matchesRepository.findOne({
        where: { externalId },
      });

      if (!match) {
        return false; // Match not tracked
      }

      if (match.isManuallyLocked) {
        this.logger.log(
          `Partido ${match.id} (Ext: ${externalId}) está bloqueado manualmente. Saltando.`,
        );
        return false;
      }

      // Detectar cambios o necesidad de restaurar nombres/banderas
      const needsNames =
        !match.homeTeam ||
        !match.awayTeam ||
        !match.homeFlag ||
        !match.awayFlag;
      const hasChanged =
        match.homeScore !== homeScore ||
        match.awayScore !== awayScore ||
        match.status !== 'COMPLETED' ||
        needsNames;

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
      
      // Update elapsed time if available
      if (fixture.fixture.status.elapsed !== null) {
        match.minute = fixture.fixture.status.elapsed;
      }

      // COMPREHENSIVE STATUS MAPPING
      // FT = Full Time, AET = After Extra Time, PEN = Penalties
      if (['FT', 'AET', 'PEN'].includes(statusShort)) {
        if (match.status !== 'FINISHED') {
          match.status = 'FINISHED';
          await this.matchesRepository.save(match);

          this.logger.log(
            `🏁 Partido ${match.id} finalizado. Calculando puntos...`,
          );
          await this.scoringService.calculatePointsForMatch(match.id);

          // Promote winner if it's a knockout match
          await this.tournamentService.promoteToNextRound(match);
        }
      } else if (['1H', '2H', 'HT', 'ET', 'P', 'BT', 'LIVE'].includes(statusShort)) {
        // 1H = First Half, 2H = Second Half, HT = Half Time
        // ET = Extra Time, P = Penalty Shootout, BT = Break Time
        if (match.status !== 'LIVE') {
          match.status = 'LIVE';
          this.logger.log(
            `🔴 Partido ${match.id} ahora está EN VIVO (${statusShort})`,
          );
        }
        await this.matchesRepository.save(match);
      } else if (statusShort === 'NS') {
        // NS = Not Started - keep as scheduled
        this.logger.log(
          `⏳ Partido ${match.id} aún no ha comenzado (${statusShort})`,
        );
      } else {
        // Unknown status, save anyway but log warning
        this.logger.warn(
          `⚠️  Unknown status "${statusShort}" for match ${match.id}`,
        );
        await this.matchesRepository.save(match);
      }

      return true;
    } catch (e) {
      this.logger.error(`Error procesando fixture ${fixture?.fixture?.id}`, e);
      return false;
    }
  }
}
