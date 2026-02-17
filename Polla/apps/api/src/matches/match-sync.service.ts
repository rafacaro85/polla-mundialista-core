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

  @Cron('*/5 * * * *') // Run every 5 minutes
  async syncLiveMatches() {
    try {
      // 0. AUTO-INCREMENT MANUAL TIMERS (Runs every 5 minutes now, but we logic expects 1 min?)
      // Wait, if cron is every 5 minutes, we should increment by 5.
      try {
        const activeTimerMatches = await this.matchesRepository.find({
            where: { status: 'LIVE', isTimerActive: true }
        });
        
        if (activeTimerMatches.length > 0) {
            this.logger.log(`⏱️  Auto-incrementing timer for ${activeTimerMatches.length} matches...`);
            for (const m of activeTimerMatches) {
                if (m.minute && !isNaN(Number(m.minute))) {
                    const nextMin = Number(m.minute) + 5; // Increment by 5 because Cron is 5 min
                    await this.matchesRepository.update(m.id, { minute: nextMin.toString() });
                    this.logger.log(`   -> Match ${m.homeTeam} vs ${m.awayTeam}: ${m.minute}' -> ${nextMin}'`);
                } else if (!m.minute) {
                     await this.matchesRepository.update(m.id, { minute: '1' });
                }
            }
        }
      } catch (timerError) {
          this.logger.error('Error auto-incrementing timers:', timerError);
      }

      this.logger.log(
        `🕒 Smart Sync (Batch Mode): Checking ALL active matches (Time Window Disabled)`,
      );

      // Query matches with externalId that are NOT FINISHED
      const matches = await this.matchesRepository
        .createQueryBuilder('match')
        .where('match.externalId IS NOT NULL')
        .andWhere('match.status != :status', { status: 'FINISHED' })
        .andWhere('match.isTimerActive = false') 
        .getMany();

      if (matches.length === 0) {
        this.logger.log('📊 No active matches in window. Skipping API call.');
        return;
      }

      this.logger.log(
        `📡 Requesting INDIVIDUAL Update for ${matches.length} matches...`,
      );

      // INDIVIDUAL LOOP STRATEGY: Revert to single calls to avoid 403 Batch Error
      let updatedCount = 0;
      
      for (const match of matches) {
        try {
            this.logger.log(`� Syncing Match ID: ${match.externalId} ...`);
            
            const { data } = await firstValueFrom(
                this.httpService.get('/fixtures', {
                    params: { id: match.externalId }, // Single ID
                }),
            );

            const fixtures = data.response;
            if (fixtures && fixtures.length > 0) {
                const wasUpdated = await this.processFixtureData(fixtures[0]);
                if (wasUpdated) updatedCount++;
            }
        } catch (innerError) {
            this.logger.error(`❌ Error syncing match ${match.externalId}:`, innerError.message);
        }
      }

      if (updatedCount > 0) {
        this.logger.log(`🎉 Sync completed. ${updatedCount} matches updated.`);
      }
      } catch (error) {
        this.logger.error(`❌ Error in Batch API Request:`, error.message);
      }
    } catch (error) {
      this.logger.error('💥 General Sync Error', error);
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
