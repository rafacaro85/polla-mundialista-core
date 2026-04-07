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
      '🔄 Running SYNC (Target: football-data.org)',
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

      const activeTournaments = [...new Set(filteredMatches.map(m => m.tournamentId))];

      const TOURNAMENT_MAP: Record<string, { competition: string; season: number }> = {
        'WC2026': { competition: 'WC', season: 2026 },
        'UCL2526': { competition: 'CL', season: 2025 },
        'COL2026': { competition: 'COL1', season: 2026 },
      };

      const apiKey = this.configService.get<string>('FOOTBALL_DATA_API_KEY');
      if (!apiKey) {
         this.logger.error('❌ Missing FOOTBALL_DATA_API_KEY environment variable!');
         return;
      }

      for (const tournamentId of activeTournaments) {
        if (!tournamentId) continue;
        
        const tMap = TOURNAMENT_MAP[tournamentId];
        if (!tMap) {
          this.logger.warn(`⚠️ No mapping found in TOURNAMENT_MAP for ${tournamentId}`);
          continue;
        }

        const dateTodayStr = new Date().toISOString().split('T')[0];

        // 1. Request All IN_PLAY & PAUSED
        try {
          this.logger.log(`🔄 BULK Syncing LIVE matches for ${tournamentId} (target: API bulk)...`);
          const inPlayRes = await axios.get(
            `https://api.football-data.org/v4/competitions/${tMap.competition}/matches?status=IN_PLAY,PAUSED`,
            { headers: { 'X-Auth-Token': apiKey } }
          );
          
          const inPlayMatches = inPlayRes.data?.matches || [];
          for (const apiMatch of inPlayMatches) {
             await this.processFixtureData(apiMatch);
          }
        } catch (innerError) {
          this.logger.error(`❌ Error bulk syncing LIVE for ${tournamentId}: ${innerError.message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 6100)); // Throttle

        // 2. Request All FINISHED today
        try {
          this.logger.log(`🔄 BULK Syncing FINISHED matches today for ${tournamentId}...`);
          const finRes = await axios.get(
            `https://api.football-data.org/v4/competitions/${tMap.competition}/matches?status=FINISHED&dateFrom=${dateTodayStr}&dateTo=${dateTodayStr}`,
            { headers: { 'X-Auth-Token': apiKey } }
          );
          
          const finMatches = finRes.data?.matches || [];
          for (const apiMatch of finMatches) {
             await this.processFixtureData(apiMatch);
          }
        } catch (innerError) {
          this.logger.error(`❌ Error bulk syncing FINISHED for ${tournamentId}: ${innerError.message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 6100)); // Throttle
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
        const LIVE_STATUSES = ['IN_PLAY'];
        const PAUSED_STATUSES = ['PAUSED', 'HALFTIME'];
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
        } else if (PAUSED_STATUSES.includes(statusShort)) {
          if (match.status !== 'PAUSED') {
            match.status = 'PAUSED';
            match.minute = 'HT';
            this.logger.log(`⏸️ Match ${match.id} is now PAUSED (HT)`);
          }
          await this.matchesRepository.save(match);
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
