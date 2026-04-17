import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AnalyticsCache } from '../database/entities/analytics-cache.entity';
import { RankingSnapshot } from '../database/entities/ranking-snapshot.entity';
import { UserSession } from '../database/entities/user-session.entity';
import { League } from '../database/entities/league.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { UserLeague } from '../database/entities/user-league.entity';
import { Match } from '../database/entities/match.entity';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    private dataSource: DataSource,
    @InjectRepository(AnalyticsCache) private cacheRepo: Repository<AnalyticsCache>,
    @InjectRepository(RankingSnapshot) private snapshotsRepo: Repository<RankingSnapshot>,
    @InjectRepository(UserSession) private sessionsRepo: Repository<UserSession>,
    @InjectRepository(League) private leaguesRepo: Repository<League>,
    @InjectRepository(Prediction) private predictionsRepo: Repository<Prediction>,
    @InjectRepository(UserLeague) private userLeaguesRepo: Repository<UserLeague>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async computeNightlyAnalytics() {
    this.logger.log('Starting nightly analytics cron job');
    const activeLeagues = await this.leaguesRepo.find({ where: { status: 'ACTIVE' } });
    
    for (const league of activeLeagues) {
      try {
        await this.generateAndCacheAllReports(league.id);
      } catch (err: any) {
        this.logger.error(`Error computing analytics for league ${league.id}: ${err.message}`);
      }
    }
    this.logger.log('Nightly analytics completed');
  }

  async generateAndCacheAllReports(leagueId: string) {
    const methods = [
      { type: 'executive-summary', fn: this.getExecutiveSummary.bind(this) },
      { type: 'final-ranking', fn: this.getFinalRanking.bind(this) },
      { type: 'department-participation', fn: this.getDepartmentParticipation.bind(this) },
      { type: 'activity-by-matchday', fn: this.getActivityByMatchday.bind(this) },
      { type: 'predictions-analysis', fn: this.getPredictionsAnalysis.bind(this) },
      { type: 'joker-usage', fn: this.getJokerUsage.bind(this) },
      { type: 'bonus-questions', fn: this.getBonusQuestions.bind(this) },
      { type: 'individual-evolution', fn: this.getIndividualEvolution.bind(this) },
      { type: 'top-players', fn: this.getTopPlayers.bind(this) },
      { type: 'engagement', fn: this.getEngagementROI.bind(this) },
    ];

    for (const m of methods) {
       const data = await m.fn(leagueId, true); // true forces skip cache
       await this.saveCache(leagueId, m.type, data);
    }
  }

  private async getCache(leagueId: string, type: string) {
    const cached = await this.cacheRepo.findOne({ where: { leagueId, reportType: type } });
    if (cached && (Date.now() - cached.computedAt.getTime()) < 24 * 60 * 60 * 1000) {
      return cached.data;
    }
    return null;
  }

  private async saveCache(leagueId: string, type: string, data: any) {
    let cached = await this.cacheRepo.findOne({ where: { leagueId, reportType: type } });
    if (!cached) {
      cached = this.cacheRepo.create({ leagueId, reportType: type });
    }
    cached.data = data;
    cached.computedAt = new Date();
    await this.cacheRepo.save(cached);
  }

  async getExecutiveSummary(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'executive-summary');
      if (cache) return cache;
    }
    
    // Total participates
    const totalParticipants = await this.userLeaguesRepo.count({ where: { leagueId } });
    const totalPredictions = await this.predictionsRepo.count({ where: { user: { userLeagues: { leagueId }  } } });
    
    const data = {
      totalParticipants,
      totalPredictions,
      winner: { name: 'Juan Pérez', points: 145, avatar: null }, // Mocked
      topMatch: { homeTeam: 'Colombia', awayTeam: 'Brasil', predictions: 85 } // Mocked
    };
    
    if (!forceRealtime) await this.saveCache(leagueId, 'executive-summary', data);
    return data;
  }

  async getFinalRanking(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'final-ranking');
      if (cache) return cache;
    }
    
    const participants = await this.userLeaguesRepo.find({ 
      where: { leagueId, status: 'APPROVED' },
      relations: ['user'],
      order: { totalPoints: 'DESC' },
      take: 10
    });

    const data = participants.map((p, idx) => ({
      position: idx + 1,
      userId: p.userId,
      avatar: p.user?.avatarUrl,
      name: p.user?.displayName || p.user?.email,
      total: p.totalPoints,
      regular: p.totalPoints, // TODO distribute correctly
      joker: 0,
      bonus: 0
    }));

    if (!forceRealtime) await this.saveCache(leagueId, 'final-ranking', data);
    return data;
  }

  async getDepartmentParticipation(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'department-participation');
      if (cache) return cache;
    }
    const data = [
      { department: 'Ventas', percentage: 45 },
      { department: 'Tecnología', percentage: 30 },
      { department: 'Recursos Humanos', percentage: 15 },
      { department: 'Operaciones', percentage: 10 },
    ];
    if (!forceRealtime) await this.saveCache(leagueId, 'department-participation', data);
    return data;
  }

  async getActivityByMatchday(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'activity-by-matchday');
      if (cache) return cache;
    }
    const data = Array.from({ length: 15 }, (_, i) => ({
      day: `Día ${i + 1}`,
      predictions: Math.floor(Math.random() * 100) + 20
    }));
    if (!forceRealtime) await this.saveCache(leagueId, 'activity-by-matchday', data);
    return data;
  }

  async getPredictionsAnalysis(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'predictions-analysis');
      if (cache) return cache;
    }
    const data = {
      mostExact: { match: 'Argentina vs México', exacts: 42 },
      mostFailed: { match: 'Alemania vs Japón', exacts: 0 },
      accuracy: { exact: 15, partial: 35, wrong: 50 }
    };
    if (!forceRealtime) await this.saveCache(leagueId, 'predictions-analysis', data);
    return data;
  }

  async getJokerUsage(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'joker-usage');
      if (cache) return cache;
    }
    const data = [
      { name: 'Ana Gómez', points: 14, match: 'Francia vs España', avatar: null },
      { name: 'Carlos Ruíz', points: 10, match: 'Brasil vs Uruguay', avatar: null },
      { name: 'Luis Silva', points: 8, match: 'Colombia vs Perú', avatar: null },
    ];
    if (!forceRealtime) await this.saveCache(leagueId, 'joker-usage', data);
    return data;
  }

  async getBonusQuestions(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'bonus-questions');
      if (cache) return cache;
    }
    const data = [
      { question: '¿Equipo en recibir la primera roja?', accuracy: 12 },
      { question: '¿Goleador del torneo?', accuracy: 45 },
    ];
    if (!forceRealtime) await this.saveCache(leagueId, 'bonus-questions', data);
    return data;
  }

  async getIndividualEvolution(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'individual-evolution');
      if (cache) return cache;
    }
    const matchdays = ['J1', 'J2', 'J3', 'Oct', 'Cua', 'Sem', 'Fin'];
    const data = matchdays.map((m, i) => ({
      name: m,
      'Juan Pérez': 10 + i * 15 + Math.random() * 5,
      'Ana Gómez': 8 + i * 14 + Math.random() * 5,
      'Carlos Ruíz': 12 + i * 13 + Math.random() * 5,
    }));
    if (!forceRealtime) await this.saveCache(leagueId, 'individual-evolution', data);
    return data;
  }

  async getTopPlayers(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'top-players');
      if (cache) return cache;
    }
    const data = [
      { badge: '🏆 Campeón', name: 'Juan Pérez', detail: '145 pts', color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
      { badge: '⚡ Más activo', name: 'Laura Gómez', detail: '64 pred.', color: 'text-blue-500', bg: 'bg-blue-500/10' },
      { badge: '🎯 Más preciso', name: 'Carlos Ruíz', detail: '12 plenos', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
      { badge: '🃏 Mejor comodín', name: 'Ana Silva', detail: '14 pts', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    ];
    if (!forceRealtime) await this.saveCache(leagueId, 'top-players', data);
    return data;
  }

  async getEngagementROI(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'engagement');
      if (cache) return cache;
    }
    const data = {
      totalHours: 1250,
      avgSessionsPerUser: 14.5,
      activeDays: 30,
      activityData: Array.from({ length: 30 }, (_, i) => ({
        day: `Día ${i + 1}`,
        sessions: Math.floor(Math.random() * 50) + 10
      }))
    };
    if (!forceRealtime) await this.saveCache(leagueId, 'engagement', data);
    return data;
  }
}
