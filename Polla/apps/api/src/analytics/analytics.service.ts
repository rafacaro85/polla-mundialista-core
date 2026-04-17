import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';

import { AnalyticsCache } from '../database/entities/analytics-cache.entity';
import { RankingSnapshot } from '../database/entities/ranking-snapshot.entity';
import { UserSession } from '../database/entities/user-session.entity';
import { League } from '../database/entities/league.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { Match } from '../database/entities/match.entity';
import { LeagueStatus } from '../database/enums/league-status.enum';
import { LeagueParticipantStatus } from '../database/enums/league-participant-status.enum';

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
    @InjectRepository(LeagueParticipant) private leagueParticipantsRepo: Repository<LeagueParticipant>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async computeNightlyAnalytics() {
    this.logger.log('Starting nightly analytics cron job');
    const activeLeagues = await this.leaguesRepo.find({ where: { status: LeagueStatus.ACTIVE } });
    
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
    if (cached && (Date.now() - new Date(cached.computedAt).getTime()) < 24 * 60 * 60 * 1000) {
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
    const totalParticipants = await this.leagueParticipantsRepo.count({ where: { league: { id: leagueId } } });
    const totalPredictions = await this.predictionsRepo.createQueryBuilder('pred')
      .innerJoin('pred.user', 'user')
      .innerJoin('user.leagueParticipants', 'lp')
      .innerJoin('lp.league', 'league')
      .where('league.id = :leagueId', { leagueId })
      .getCount();
    
    const winnerData = await this.leagueParticipantsRepo.findOne({
      where: { league: { id: leagueId }, status: LeagueParticipantStatus.ACTIVE },
      relations: ['user'],
      order: { totalPoints: 'DESC' }
    });

    const data = {
      totalParticipants,
      totalPredictions,
      winner: winnerData ? { name: winnerData.user?.fullName || 'Anon', points: winnerData.totalPoints, avatar: winnerData.user?.avatarUrl } : { name: 'Sin ganador', points: 0, avatar: null },
      topMatch: { homeTeam: '...', awayTeam: '...', predictions: 0 } // Requiere agregacion mas compleja, se omite de forma temporal real
    };
    
    if (!forceRealtime) await this.saveCache(leagueId, 'executive-summary', data);
    return data;
  }

  async getFinalRanking(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'final-ranking');
      if (cache) return cache;
    }
    
    const participants = await this.leagueParticipantsRepo.find({ 
      where: { league: { id: leagueId }, status: LeagueParticipantStatus.ACTIVE },
      relations: ['user'],
      order: { totalPoints: 'DESC' },
      take: 10
    });

    const data = participants.map((p, idx) => ({
      position: idx + 1,
      userId: p.user?.id,
      avatar: p.user?.avatarUrl,
      name: p.user?.fullName || p.user?.email,
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
    const participants = await this.leagueParticipantsRepo.find({
      where: { league: { id: leagueId }, status: LeagueParticipantStatus.ACTIVE }
    });
    
    const depts: Record<string, number> = {};
    for (const p of participants) {
      const d = p.department || 'Sin Área';
      depts[d] = (depts[d] || 0) + 1;
    }
    
    const total = participants.length || 1;
    const data = Object.keys(depts).map(d => ({
      department: d,
      percentage: Math.round((depts[d] / total) * 100)
    })).sort((a,b) => b.percentage - a.percentage);
    if (!forceRealtime) await this.saveCache(leagueId, 'department-participation', data);
    return data;
  }

  async getActivityByMatchday(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'activity-by-matchday');
      if (cache) return cache;
    }
    const data: any[] = []; // Actividad dinámica requiere historial en la BD. Desabilitado mientras hay datos reales.
    if (!forceRealtime) await this.saveCache(leagueId, 'activity-by-matchday', data);
    return data;
  }

  async getPredictionsAnalysis(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'predictions-analysis');
      if (cache) return cache;
    }
    const data = {
      mostExact: { match: '-', exacts: 0 },
      mostFailed: { match: '-', exacts: 0 },
      accuracy: { exact: 0, partial: 0, wrong: 0 }
    };
    if (!forceRealtime) await this.saveCache(leagueId, 'predictions-analysis', data);
    return data;
  }

  async getJokerUsage(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'joker-usage');
      if (cache) return cache;
    }
    const data: any[] = [];
    if (!forceRealtime) await this.saveCache(leagueId, 'joker-usage', data);
    return data;
  }

  async getBonusQuestions(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'bonus-questions');
      if (cache) return cache;
    }
    const data: any[] = [];
    if (!forceRealtime) await this.saveCache(leagueId, 'bonus-questions', data);
    return data;
  }

  async getIndividualEvolution(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'individual-evolution');
      if (cache) return cache;
    }
    const data: any[] = [];
    if (!forceRealtime) await this.saveCache(leagueId, 'individual-evolution', data);
    return data;
  }

  async getTopPlayers(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'top-players');
      if (cache) return cache;
    }
    const leader = await this.leagueParticipantsRepo.findOne({
      where: { league: { id: leagueId }, status: LeagueParticipantStatus.ACTIVE },
      order: { totalPoints: 'DESC' },
      relations: ['user']
    });

    const data: any[] = [];
    if (leader) {
      data.push({ badge: '🏆 Campeón actual', name: leader.user?.fullName, detail: `${leader.totalPoints} pts`, color: 'text-yellow-500', bg: 'bg-yellow-500/10' });
    }
    if (!forceRealtime) await this.saveCache(leagueId, 'top-players', data);
    return data;
  }

  async getEngagementROI(leagueId: string, forceRealtime = false) {
    if (!forceRealtime) {
      const cache = await this.getCache(leagueId, 'engagement');
      if (cache) return cache;
    }
    const data = {
      totalHours: 0,
      avgSessionsPerUser: 0,
      activeDays: 0,
      activityData: []
    };
    if (!forceRealtime) await this.saveCache(leagueId, 'engagement', data);
    return data;
  }
}
