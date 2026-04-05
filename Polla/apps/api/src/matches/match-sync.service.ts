import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { ScoringService } from '../scoring/scoring.service';
import { TournamentService } from '../tournament/tournament.service';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MatchSyncService {
  private readonly logger = new Logger(MatchSyncService.name);
  private isSyncing = false;
  private nextRunTime: Date = new Date();

  constructor(
    @InjectRepository(Match)
    private matchesRepository: Repository<Match>,
    private scoringService: ScoringService,
    private tournamentService: TournamentService,
    private configService: ConfigService,
  ) {}

  // 🕒 CRON: Run every 1 minute but use intelligent skipping
  @Cron('*/1 * * * *')
  async syncLiveMatches() {
    if (this.isSyncing) {
      this.logger.warn('⏭️ Sync already in progress, skipping this run.');
      return;
    }

    if (new Date() < this.nextRunTime) {
      return;
    }

    this.isSyncing = true;
    this.logger.log(
      '🔄 Running URGENT SYNC (Target: API-SPORTS Direct / Throttled Loop)',
    );

    try {
      // 1. Intelligent Time Window check
      const now = new Date();
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000);
      const oneHourFromNow = new Date(now.getTime() + 1 * 60 * 60 * 1000);
      
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const matchesToday = await this.matchesRepository
        .createQueryBuilder('match')
        .where('match.status != :finished', { finished: 'FINISHED' })
        .andWhere('match.externalId IS NOT NULL')
        .andWhere('match.date IS NOT NULL')
        .andWhere('match.date >= :start', { start: startOfDay })
        .andWhere('match.date <= :end', { end: endOfDay })
        .getMany();

      const filteredMatches = matchesToday.filter(m => m.date >= threeHoursAgo && m.date <= oneHourFromNow);

      if (filteredMatches.length > 0) {
        this.logger.log(`🎯 Found ${filteredMatches.length} active matches. Setting next run to 1 minute.`);
        this.nextRunTime = new Date(now.getTime() + 1 * 60 * 1000); // 1 minuto
      } else if (matchesToday.length > 0) {
        this.nextRunTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutos
        this.logger.log('💤 Partidos programados para hoy pero inactivos ahora. Próximo check en 5 minutos.');
        return;
      } else {
        this.nextRunTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos
        this.logger.log('💤 No hay partidos programados hoy. Próximo check en 30 minutos.');
        return;
      }

      // 2. Individual Loop with PAUSE (Prevents 429 & 403)
      for (const match of filteredMatches) {
        if (!match.externalId) continue;

        try {
          this.logger.log(
            `🔄 Syncing Match ID: ${match.externalId} (${match.homeTeam} vs ${match.awayTeam})...`,
          );

          // REQUEST FOOTBALL-DATA.ORG
          const apiKey = this.configService.get<string>('FOOTBALL_DATA_API_KEY');
          if (!apiKey) {
             this.logger.error('❌ Missing FOOTBALL_DATA_API_KEY environment variable!');
             return;
          }

          const response = await axios.get(
            `https://api.football-data.org/v4/matches/${match.externalId}`,
            { headers: { 'X-Auth-Token': apiKey } }
          );

          if (response.data && response.data.id) {
            await this.processFixtureData(response.data);
          } else {
            this.logger.warn(
              `⚠️ API Warning for match ${match.externalId}: invalid response format`,
            );
          }
        } catch (innerError) {
          this.logger.error(
            `❌ Error syncing match ${match.externalId} (fallback triggered): ${innerError.message}`,
          );
        }

        // 🛑 THROTTLE: Wait 6.1 seconds between calls to respect 10 calls/min rate limit limit of football-data
        await new Promise((resolve) => setTimeout(resolve, 6100));
      }
    } catch (error) {
      this.logger.error('❌ CRITICAL ERROR in syncLiveMatches:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // 🛠️ HELPER: Process Single Fixture
  async processFixtureData(fixture: any): Promise<boolean> {
    try {
      const matchData = fixture; // football-data single match structure
      const externalId = matchData.id;
      const statusShort = matchData.status; // e.g. FINISHED, IN_PLAY, PAUSED, HALFTIME
      
      // goals
      const homeScore = matchData.score?.fullTime?.home ?? matchData.score?.regularTime?.home;
      const awayScore = matchData.score?.fullTime?.away ?? matchData.score?.regularTime?.away;
      const elapsed = matchData.minute || null;

      const match = await this.matchesRepository.findOne({
        where: { externalId: Number(externalId) },
      });

      if (!match) return false;

      if (match.isManuallyLocked) return false;

      const hasChanged =
        match.homeScore !== homeScore ||
        match.awayScore !== awayScore ||
        match.status !== 'FINISHED';

      if (hasChanged) {
        if (!match.homeTeam) match.homeTeam = matchData.homeTeam.name;
        if (!match.awayTeam) match.awayTeam = matchData.awayTeam.name;

        match.homeScore = homeScore;
        match.awayScore = awayScore;

        if (elapsed !== null) match.minute = elapsed;

        // STATUS LOGIC (football-data.org formatting)
        const FINISHED_STATUSES = ['FINISHED', 'AWARDED'];
        const LIVE_STATUSES = ['IN_PLAY', 'PAUSED', 'HALFTIME'];
        const CANCELLED_STATUSES = ['POSTPONED', 'CANCELLED', 'SUSPENDED'];

        if (FINISHED_STATUSES.includes(statusShort)) {
          if (match.status !== 'FINISHED') {
            match.status = 'FINISHED';
            await this.matchesRepository.save(match);

            this.logger.log(
              `🏁 Match ${match.id} FINISHED. Calculating points...`,
            );
            await this.scoringService.calculatePointsForMatch(match.id);
            await this.tournamentService.promoteToNextRound(match);
          } else {
            await this.matchesRepository.save(match);
          }
        } else if (LIVE_STATUSES.includes(statusShort)) {
          if (match.status !== 'LIVE') {
            match.status = 'LIVE';
            this.logger.log(`🔴 Match ${match.id} is now LIVE.`);
          }
          await this.matchesRepository.save(match);
        } else if (CANCELLED_STATUSES.includes(statusShort)) {
          if (match.status !== statusShort) {
            match.status = statusShort; // Guarda PST, CANC o ABD
            this.logger.warn('Match postponed or cancelled', { matchId: match.id, status: statusShort });
          }
          await this.matchesRepository.save(match);
        } else {
          await this.matchesRepository.save(match);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error processing fixture data: ${error.message}`);
      return false;
    }
  }
}
