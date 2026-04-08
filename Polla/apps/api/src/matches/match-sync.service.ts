import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { ScoringService } from '../scoring/scoring.service';
import { TournamentService } from '../tournament/tournament.service';
import axios from 'axios';
import * as https from 'https';
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
      
      // FIX: Usar UTC explícito para evitar problemas de timezone en Railway
      const startOfDay = new Date(now);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(now);
      endOfDay.setUTCHours(23, 59, 59, 999);

      // --- DIAGNÓSTICO PROFUNDO ---
      const debugMatches = await this.matchesRepository.find({
        order: { date: 'ASC' },
        take: 20
      });
      this.logger.log(`🔍 [DEEP-DIAG] Total matches in DB: ${debugMatches.length}`);
      debugMatches.forEach(m => {
        this.logger.log(`   ID: ${m.id} | ${m.homeTeam} vs ${m.awayTeam} | Date: ${m.date?.toISOString?.()} | ExtId: ${m.externalId}`);
      });
      // ----------------------------

      // DIAGNÓSTICO: Log para depuración
      this.logger.log(`📅 [DIAG] Server now: ${now.toISOString()} | Range: ${startOfDay.toISOString()} → ${endOfDay.toISOString()}`);

      // Consulta AMPLIA primero: todos los partidos del día sin filtrar status
      const allMatchesToday = await this.matchesRepository
        .createQueryBuilder('match')
        .where('match.externalId IS NOT NULL')
        .andWhere('match.date IS NOT NULL')
        .andWhere('match.date >= :start', { start: startOfDay })
        .andWhere('match.date <= :end', { end: endOfDay })
        .getMany();

      this.logger.log(`📅 [DIAG] Total partidos hoy (cualquier status): ${allMatchesToday.length}`);
      if (allMatchesToday.length > 0) {
        for (const m of allMatchesToday) {
          this.logger.log(`   ↳ ${m.homeTeam} vs ${m.awayTeam} | date=${m.date?.toISOString?.()} | status=${m.status} | extId=${m.externalId} | tournament=${m.tournamentId}`);
        }
      } else {
        // AUTO-REPARACIÓN: Buscar si hay partidos HOY pero sin externalId
        const matchesWithoutExtId = await this.matchesRepository
          .createQueryBuilder('match')
          .where('match.date IS NOT NULL')
          .andWhere('match.date >= :start', { start: startOfDay })
          .andWhere('match.date <= :end', { end: endOfDay })
          .andWhere('(match.externalId IS NULL OR match.externalId = 0)')
          .getMany();

        if (matchesWithoutExtId.length > 0) {
          this.logger.warn(`🔧 [AUTO-FIX] Encontrados ${matchesWithoutExtId.length} partidos HOY sin externalId. Ejecutando auto-asignación...`);
          const tournaments = [...new Set(matchesWithoutExtId.map(m => m.tournamentId))];
          for (const tid of tournaments) {
            try {
              const result = await this.autoAssignExternalIds(tid);
              this.logger.log(`🔧 [AUTO-FIX] Resultado para ${tid}: ${result.assigned || 0} IDs asignados`);
            } catch (e: any) {
              this.logger.error(`🔧 [AUTO-FIX] Error asignando IDs para ${tid}: ${e.message}`);
            }
          }
          // Re-ejecutar la consulta original tras la auto-reparación
          const retryMatches = await this.matchesRepository
            .createQueryBuilder('match')
            .where('match.externalId IS NOT NULL')
            .andWhere('match.date IS NOT NULL')
            .andWhere('match.date >= :start', { start: startOfDay })
            .andWhere('match.date <= :end', { end: endOfDay })
            .getMany();
          // Reemplazar el array original
          allMatchesToday.push(...retryMatches);
          this.logger.log(`🔧 [AUTO-FIX] Tras reparación: ${allMatchesToday.length} partidos con externalId`);
        } else {
          // Si no hay partidos hoy, buscar los próximos para informar
          const nextMatches = await this.matchesRepository
            .createQueryBuilder('match')
            .where('match.externalId IS NOT NULL')
            .andWhere('match.date IS NOT NULL')
            .andWhere('match.date > :now', { now })
            .andWhere('match.status != :finished', { finished: 'FINISHED' })
            .orderBy('match.date', 'ASC')
            .take(3)
            .getMany();
          if (nextMatches.length > 0) {
            this.logger.log(`📅 [DIAG] Próximos partidos en BD:`);
            for (const m of nextMatches) {
              this.logger.log(`   ↳ ${m.homeTeam} vs ${m.awayTeam} | date=${m.date?.toISOString?.()} | status=${m.status} | extId=${m.externalId}`);
            }
          } else {
            this.logger.warn(`📅 [DIAG] ⚠️ NO hay NINGÚN partido futuro con externalId en la BD!`);
          }
        }
      }

      // Filtrar solo los NO finalizados
      const matchesToday = allMatchesToday.filter(m => m.status !== 'FINISHED');
      this.logger.log(`📅 [DIAG] Partidos hoy NO finalizados: ${matchesToday.length}`);

      const filteredMatches = matchesToday.filter(m => {
        const matchDate = new Date(m.date);
        return matchDate >= threeHoursAgo && matchDate <= oneHourFromNow;
      });

      if (filteredMatches.length > 0) {
        this.logger.log(`🎯 Found ${filteredMatches.length} active matches in time window. Syncing every 1 minute.`);
        this.nextRunTime = new Date(now.getTime() + 1 * 60 * 1000);
      } else if (matchesToday.length > 0) {
        this.nextRunTime = new Date(now.getTime() + 5 * 60 * 1000);
        this.logger.log(`💤 ${matchesToday.length} partidos hoy pero fuera de ventana activa. Próximo check en 5 min.`);
        return;
      } else {
        this.nextRunTime = new Date(now.getTime() + 30 * 60 * 1000);
        this.logger.log('💤 No hay partidos programados hoy (o todos FINISHED). Próximo check en 30 minutos.');
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

        const fetchWithRetry = async (url: string) => {
          let retries = 3;
          while (retries > 0) {
            try {
              return await axios.get(url, {
                headers: { 'X-Auth-Token': apiKey },
                timeout: 30000,
                httpsAgent: new https.Agent({ rejectUnauthorized: false })
              });
            } catch (error: any) {
              if (error.code === 'ETIMEDOUT' || error.code === 'ECONNABORTED') {
                retries--;
                if (retries === 0) throw error;
                await new Promise(r => setTimeout(r, 3000));
              } else {
                throw error;
              }
            }
          }
          throw new Error('Max retries reached');
        };

        // 1. Request All IN_PLAY & PAUSED
        try {
          this.logger.log(`🔄 BULK Syncing LIVE matches for ${tournamentId} (target: API bulk)...`);
          const inPlayRes = await fetchWithRetry(
            `https://api.football-data.org/v4/competitions/${tMap.competition}/matches?status=IN_PLAY,PAUSED`
          );
          
          const inPlayMatches = inPlayRes.data?.matches || [];
          for (const apiMatch of inPlayMatches) {
             await this.processFixtureData(apiMatch);
          }
        } catch (innerError: any) {
          this.logger.error(`❌ Error bulk syncing LIVE for ${tournamentId}: ${innerError.message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, 6100)); // Throttle

        // 2. Request All FINISHED today
        try {
          this.logger.log(`🔄 BULK Syncing FINISHED matches today for ${tournamentId}...`);
          const finRes = await fetchWithRetry(
            `https://api.football-data.org/v4/competitions/${tMap.competition}/matches?status=FINISHED&dateFrom=${dateTodayStr}&dateTo=${dateTodayStr}`
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
      const matchData = fixture;
      const externalId = matchData.id;
      const statusShort = matchData.status; // FINISHED, IN_PLAY, PAUSED, TIMED, SCHEDULED

      // ============================================================
      // FIX #1: Extracción robusta de goles
      // football-data.org v4 usa fullTime como "running total" durante
      // el partido. halfTime se llena al entretiempo.
      // Si ambos son null, intentamos contar desde el array goals[].
      // ============================================================
      let homeScore: number | null = matchData.score?.fullTime?.home ?? null;
      let awayScore: number | null = matchData.score?.fullTime?.away ?? null;

      // Fallback 1: Si fullTime es null, intentar halfTime
      if (homeScore === null || awayScore === null) {
        homeScore = matchData.score?.halfTime?.home ?? null;
        awayScore = matchData.score?.halfTime?.away ?? null;
      }

      // Fallback 2: Si aún es null pero hay goles en el array goals[], contarlos
      if ((homeScore === null || awayScore === null) && matchData.goals?.length > 0) {
        const lastGoal = matchData.goals[matchData.goals.length - 1];
        homeScore = lastGoal?.score?.home ?? 0;
        awayScore = lastGoal?.score?.away ?? 0;
      }

      // Si el partido está IN_PLAY o PAUSED y no hay goles, inicializar en 0-0
      if (['IN_PLAY', 'PAUSED'].includes(statusShort) && homeScore === null) {
        homeScore = 0;
        awayScore = 0;
      }

      // ============================================================
      // FIX #2: Extracción del minuto
      // football-data.org v4 SÍ incluye "minute" como campo directo.
      // ============================================================
      const elapsed = matchData.minute ? String(matchData.minute) : null;

      const match = await this.matchesRepository.findOne({
        where: { externalId: Number(externalId) },
      });

      if (!match) {
        this.logger.warn(`⚠️ No local match found for externalId=${externalId}`);
        return false;
      }

      // NOTA: isManuallyLocked bloquea PREDICCIONES de usuarios, pero NO debe
      // bloquear la sincronización de goles/status desde la API externa.
      // Si el admin quiere pausar manualmente los scores, debe usar otro flag.

      // ============================================================
      // FIX #3: hasChanged mejorado — detectar cualquier cambio real
      // ============================================================
      const targetStatus = this.mapApiStatusToLocal(statusShort);
      const hasChanged =
        match.homeScore !== homeScore ||
        match.awayScore !== awayScore ||
        match.status !== targetStatus ||
        (elapsed !== null && match.minute !== elapsed);

      // LOG DE DIAGNÓSTICO (solo cuando hay cambios o partido activo)
      if (['IN_PLAY', 'PAUSED', 'FINISHED'].includes(statusShort)) {
        this.logger.log(
          `📊 [SYNC] externalId=${externalId} | API: ${homeScore}-${awayScore} (${statusShort}, min:${elapsed}) | ` +
          `DB: ${match.homeScore}-${match.awayScore} (${match.status}, min:${match.minute}) | ` +
          `changed=${hasChanged}`
        );
      }

      if (hasChanged) {
        if (!match.homeTeam) match.homeTeam = matchData.homeTeam?.name || matchData.homeTeam?.shortName;
        if (!match.awayTeam) match.awayTeam = matchData.awayTeam?.name || matchData.awayTeam?.shortName;

        match.homeScore = homeScore;
        match.awayScore = awayScore;

        if (elapsed !== null) match.minute = elapsed;

        // STATUS LOGIC (football-data.org status mapping)
        const FINISHED_STATUSES = ['FINISHED', 'AWARDED'];
        const LIVE_STATUSES = ['IN_PLAY'];
        const PAUSED_STATUSES = ['PAUSED'];
        const CANCELLED_STATUSES = ['POSTPONED', 'CANCELLED', 'SUSPENDED'];

        if (FINISHED_STATUSES.includes(statusShort)) {
          if (match.status !== 'FINISHED') {
            match.status = 'FINISHED';
            await this.matchesRepository.save(match);

            this.logger.log(
              `🏁 Match ${match.id} FINISHED (${homeScore}-${awayScore}). Calculating points...`,
            );
            await this.scoringService.calculatePointsForMatch(match.id);
            await this.tournamentService.promoteToNextRound(match);
          } else {
            await this.matchesRepository.save(match);
          }
        } else if (PAUSED_STATUSES.includes(statusShort)) {
          match.status = 'PAUSED';
          match.minute = 'HT';
          this.logger.log(`⏸️ Match ${match.id} → PAUSED (HT) [${homeScore}-${awayScore}]`);
          await this.matchesRepository.save(match);
        } else if (LIVE_STATUSES.includes(statusShort)) {
          match.status = 'LIVE';
          this.logger.log(`🔴 Match ${match.id} → LIVE min:${elapsed} [${homeScore}-${awayScore}]`);
          await this.matchesRepository.save(match);
        } else if (CANCELLED_STATUSES.includes(statusShort)) {
          match.status = statusShort;
          this.logger.warn('Match postponed/cancelled', { matchId: match.id, status: statusShort });
          await this.matchesRepository.save(match);
        } else {
          await this.matchesRepository.save(match);
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error processing fixture data: ${error.message}`, error.stack);
      return false;
    }
  }

  // Helper: Map football-data.org status to our internal status
  private mapApiStatusToLocal(apiStatus: string): string {
    switch (apiStatus) {
      case 'IN_PLAY': return 'LIVE';
      case 'PAUSED': return 'PAUSED';
      case 'FINISHED':
      case 'AWARDED': return 'FINISHED';
      case 'POSTPONED': return 'POSTPONED';
      case 'CANCELLED': return 'CANCELLED';
      case 'SUSPENDED': return 'SUSPENDED';
      default: return apiStatus;
    }
  }

  /**
   * Auto-assign externalIds by matching team names from football-data.org API
   * Call this endpoint when matches exist in DB but lack externalId
   */
  async autoAssignExternalIds(tournamentId: string = 'UCL2526'): Promise<any> {
    const TOURNAMENT_MAP: Record<string, { competition: string; season: number }> = {
      'WC2026': { competition: 'WC', season: 2026 },
      'UCL2526': { competition: 'CL', season: 2025 },
    };

    const tMap = TOURNAMENT_MAP[tournamentId];
    if (!tMap) {
      return { error: `No mapping for tournament ${tournamentId}` };
    }

    const apiKey = this.configService.get<string>('FOOTBALL_DATA_API_KEY');
    if (!apiKey) {
      return { error: 'Missing FOOTBALL_DATA_API_KEY' };
    }

    try {
      // 1. Get all matches from football-data.org for this competition
      const res = await axios.get(
        `https://api.football-data.org/v4/competitions/${tMap.competition}/matches?season=${tMap.season}`,
        {
          headers: { 'X-Auth-Token': apiKey },
          timeout: 30000,
          httpsAgent: new https.Agent({ rejectUnauthorized: false }),
        },
      );

      const apiMatches = res.data?.matches || [];
      this.logger.log(`🔗 [AutoAssign] Got ${apiMatches.length} matches from football-data.org for ${tournamentId}`);

      // 2. Get all local matches without externalId for this tournament
      const localMatches = await this.matchesRepository.find({
        where: { tournamentId },
      });

      const unlinked = localMatches.filter(m => !m.externalId);
      this.logger.log(`🔗 [AutoAssign] Local matches: ${localMatches.length} total, ${unlinked.length} without externalId`);

      // 3. Normalize team names for fuzzy matching
      const normalize = (name: string): string => {
        if (!name) return '';
        return name
          .toLowerCase()
          .replace(/fc |cf |sc |ac |afc |rc /gi, '')
          .replace(/\./g, '')
          .trim();
      };

      let assigned = 0;
      const results: any[] = [];

      for (const local of unlinked) {
        const localHome = normalize(local.homeTeam);
        const localAway = normalize(local.awayTeam);

        if (!localHome || !localAway) continue;

        // Find matching API match by team names
        const apiMatch = apiMatches.find((am: any) => {
          const apiHome = normalize(am.homeTeam?.name || am.homeTeam?.shortName || '');
          const apiAway = normalize(am.awayTeam?.name || am.awayTeam?.shortName || '');
          const apiHomeTla = (am.homeTeam?.tla || '').toLowerCase();
          const apiAwayTla = (am.awayTeam?.tla || '').toLowerCase();

          return (
            (apiHome.includes(localHome) || localHome.includes(apiHome) || apiHomeTla === localHome) &&
            (apiAway.includes(localAway) || localAway.includes(apiAway) || apiAwayTla === localAway)
          );
        });

        if (apiMatch) {
          local.externalId = apiMatch.id;
          // Also sync the date from football-data if not set properly
          if (apiMatch.utcDate) {
            local.date = new Date(apiMatch.utcDate);
          }
          await this.matchesRepository.save(local);
          assigned++;
          results.push({
            localId: local.id,
            teams: `${local.homeTeam} vs ${local.awayTeam}`,
            externalId: apiMatch.id,
            apiDate: apiMatch.utcDate,
            apiStatus: apiMatch.status,
          });
          this.logger.log(`✅ [AutoAssign] ${local.homeTeam} vs ${local.awayTeam} → externalId=${apiMatch.id} (date: ${apiMatch.utcDate})`);
        } else {
          results.push({
            localId: local.id,
            teams: `${local.homeTeam} vs ${local.awayTeam}`,
            externalId: null,
            error: 'No API match found',
          });
          this.logger.warn(`⚠️ [AutoAssign] No match found for: ${local.homeTeam} vs ${local.awayTeam}`);
        }
      }

      return {
        tournament: tournamentId,
        apiMatchesTotal: apiMatches.length,
        localMatchesTotal: localMatches.length,
        unlinkedBefore: unlinked.length,
        assigned,
        details: results,
      };
    } catch (error: any) {
      this.logger.error(`❌ [AutoAssign] Error: ${error.message}`);
      return { error: error.message };
    }
  }
}
