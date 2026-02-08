import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { League } from '../database/entities/league.entity';
import { User } from '../database/entities/user.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { UserBonusAnswer } from '../database/entities/user-bonus-answer.entity';
import { LeagueType } from '../database/enums/league-type.enum';
import { UserRole } from '../database/enums/user-role.enum';
import { MatchesService } from '../matches/matches.service';
import { PredictionsService } from '../predictions/predictions.service';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DemoService {
  private readonly DEMO_LEAGUE_ID = 'demo-enterprise-mundial-2026';
  private readonly DEMO_ADMIN_EMAIL = 'demo@lapollavirtual.com';
  private readonly TOURNAMENT_ID = 'WC2026';

  constructor(
    @InjectRepository(League) private leagueRepo: Repository<League>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(LeagueParticipant) private participantRepo: Repository<LeagueParticipant>,
    @InjectRepository(Match) private matchRepo: Repository<Match>,
    @InjectRepository(Prediction) private predictionRepo: Repository<Prediction>,
    @InjectRepository(BonusQuestion) private bonusRepo: Repository<BonusQuestion>,
    @InjectRepository(UserBonusAnswer) private bonusAnswerRepo: Repository<UserBonusAnswer>,
    private matchesService: MatchesService,
    private predictionsService: PredictionsService,
    private eventEmitter: EventEmitter2,
  ) {}

  async provisionDemo() {
    console.log('🚀 Provisioning Demo Environment...');

    // 1. Create or Update Demo Admin
    let admin = await this.userRepo.findOne({ where: { email: this.DEMO_ADMIN_EMAIL } });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('demo123', 10);
      admin = this.userRepo.create({
        email: this.DEMO_ADMIN_EMAIL,
        fullName: 'Administrador Demo',
        nickname: 'AdminDemo',
        password: hashedPassword,
        role: UserRole.PLAYER,
        isVerified: true,
      });
      admin = await this.userRepo.save(admin);
    }

    // 2. Create Demo League
    let league = await this.leagueRepo.findOne({ where: { id: this.DEMO_LEAGUE_ID } });
    if (league) {
        // Clear existing demo data before re-provisioning
        await this.clearDemoData();
    }

    league = this.leagueRepo.create({
      id: this.DEMO_LEAGUE_ID,
      name: 'Demo Corporativa Mundial 2026',
      type: LeagueType.COMPANY,
      isEnterprise: true,
      isEnterpriseActive: true,
      maxParticipants: 100,
      creator: admin,
      accessCodePrefix: 'DEMO-2026',
      tournamentId: this.TOURNAMENT_ID,
      companyName: 'Empresa Demo S.A.',
      brandColorPrimary: '#4F46E5', // Indigo
      brandColorBg: '#0F172A',
      isPaid: true,
      welcomeMessage: '¡Bienvenido al Demo Empresarial de La Polla Virtual! Aquí puedes ver cómo tus empleados vivirán el mundial.',
    });
    await this.leagueRepo.save(league);

    // 3. Add Admin as Participant
    const adminParticipant = this.participantRepo.create({
      user: admin,
      league: league,
      isAdmin: true,
    });
    await this.participantRepo.save(adminParticipant);

    // 4. Create Mock Participants
    const mockUsers = [];
    for (let i = 1; i <= 10; i++) {
        const user = this.userRepo.create({
            email: `player${i}@demo.com`,
            fullName: `Jugador Demo ${i}`,
            nickname: `ProPlayer${i}`,
            password: 'mock',
            isVerified: true,
        });
        mockUsers.push(await this.userRepo.save(user));
    }

    for (let i = 0; i < mockUsers.length; i++) {
        const user = mockUsers[i];
        await this.participantRepo.save(this.participantRepo.create({
            user,
            league,
            isAdmin: false,
            department: (i + 1) % 2 === 0 ? 'Ventas' : 'Tecnología',
        }));
    }

    // 5. Create Mock Predictions for Finished Matches
    const finishedMatches = await this.matchRepo.find({
        where: { tournamentId: this.TOURNAMENT_ID, status: 'FINISHED' },
        take: 10,
    });

    for (const user of mockUsers) {
        for (const match of finishedMatches) {
            await this.predictionRepo.save(this.predictionRepo.create({
                user,
                match,
                leagueId: league.id,
                homeScore: Math.floor(Math.random() * 4),
                awayScore: Math.floor(Math.random() * 4),
                points: Math.floor(Math.random() * 10), // Random points to simulate ranking
                isJoker: Math.random() > 0.8,
            }));
        }
    }

    // 6. Create Demo Bonus Questions
    const bonus = this.bonusRepo.create({
        text: '¿Quién llegará a la final?',
        points: 50,
        leagueId: league.id,
        tournamentId: this.TOURNAMENT_ID,
        isActive: true,
    });
    await this.bonusRepo.save(bonus);

    return { success: true, leagueId: league.id, adminEmail: admin.email };
  }

  async clearDemoData() {
    await this.predictionRepo.delete({ leagueId: this.DEMO_LEAGUE_ID });
    
    // For relations we use a different approach to avoid TS errors with FilterOptions
    const questions = await this.bonusRepo.find({ where: { leagueId: this.DEMO_LEAGUE_ID } });
    if (questions.length > 0) {
        const qIds = questions.map(q => q.id);
        await this.bonusAnswerRepo.createQueryBuilder()
            .delete()
            .where('questionId IN (:...qIds)', { qIds })
            .execute();
    }
    
    await this.bonusRepo.delete({ leagueId: this.DEMO_LEAGUE_ID });
    await this.participantRepo.delete({ league: { id: this.DEMO_LEAGUE_ID } });
  }

  async simulateNextMatch() {
    // Find first PENDING match for WC2026
    const pendingMatch = await this.matchRepo.findOne({
        where: { tournamentId: this.TOURNAMENT_ID, status: 'PENDING' },
        order: { date: 'ASC' },
    });

    if (!pendingMatch) throw new NotFoundException('No hay partidos pendientes para simular.');

    const h = Math.floor(Math.random() * 3);
    const a = Math.floor(Math.random() * 3);

    pendingMatch.homeScore = h;
    pendingMatch.awayScore = a;
    pendingMatch.status = 'FINISHED';
    await this.matchRepo.save(pendingMatch);

    // This triggers the event system to calculate points
    this.eventEmitter.emit('match.finished', { matchId: pendingMatch.id });

    return { 
        success: true, 
        match: `${pendingMatch.homeTeam} ${h} - ${a} ${pendingMatch.awayTeam}`,
        phase: pendingMatch.phase 
    };
  }
}
