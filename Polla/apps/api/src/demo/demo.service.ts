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
  private readonly DEMO_LEAGUE_ID = '00000000-0000-0000-0000-000000001337'; // Valid UUID for demo
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
    try {
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
          packageType: 'diamond', // Ensure it has all features
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
            const email = `player${i}@demo.com`;
            let user = await this.userRepo.findOne({ where: { email } });
            if (!user) {
                user = this.userRepo.create({
                    email,
                    fullName: `Jugador Demo ${i}`,
                    nickname: `ProPlayer${i}`,
                    password: 'mock',
                    isVerified: true,
                });
                user = await this.userRepo.save(user);
            }
            mockUsers.push(user);
        }

        for (let i = 0; i < mockUsers.length; i++) {
            const user = mockUsers[i];
            // Check if already in league
            const exists = await this.participantRepo.findOne({ 
                where: { league: { id: this.DEMO_LEAGUE_ID }, user: { id: user.id } } 
            });
            if (!exists) {
                await this.participantRepo.save(this.participantRepo.create({
                    user,
                    league,
                    isAdmin: false,
                    department: (i + 1) % 2 === 0 ? 'Ventas' : 'Tecnología',
                }));
            }
        }

        // 5. Create Mock Predictions for Finished Matches
        const finishedMatches = await this.matchRepo.find({
            where: { tournamentId: this.TOURNAMENT_ID, status: 'FINISHED' },
            take: 10,
        });

        for (const user of mockUsers) {
            for (const match of finishedMatches) {
                // Ensure unique predictions
                const existingPred = await this.predictionRepo.findOne({
                    where: { user: { id: user.id }, match: { id: match.id }, leagueId: league.id }
                });
                
                if (!existingPred) {
                    await this.predictionRepo.save(this.predictionRepo.create({
                        user,
                        match,
                        leagueId: league.id,
                        homeScore: Math.floor(Math.random() * 4),
                        awayScore: Math.floor(Math.random() * 4),
                        points: Math.floor(Math.random() * 10),
                        isJoker: Math.random() > 0.8,
                    }));
                }
            }
        }

        // 6. Create Demo Bonus Questions
        const bonusText = '¿Quién llegará a la final? (Demo)';
        let bonus = await this.bonusRepo.findOne({ where: { text: bonusText, leagueId: league.id } });
        if (!bonus) {
            bonus = this.bonusRepo.create({
                text: bonusText,
                points: 50,
                leagueId: league.id,
                tournamentId: this.TOURNAMENT_ID,
                isActive: true,
            });
            await this.bonusRepo.save(bonus);
        }

        return { success: true, leagueId: league.id, adminEmail: admin.email, admin };
    } catch (error) {
        console.error('❌ ERROR IN PROVISION_DEMO:', error);
        throw error;
    }
  }

  async clearDemoData() {
    try {
        console.log('🧹 Clearing Demo Data...');
        await this.predictionRepo.delete({ leagueId: this.DEMO_LEAGUE_ID });
        
        const questions = await this.bonusRepo.find({ where: { leagueId: this.DEMO_LEAGUE_ID } });
        if (questions.length > 0) {
            const qIds = questions.map(q => q.id);
            await this.bonusAnswerRepo.createQueryBuilder()
                .delete()
                .where('questionId IN (:...qIds)', { qIds })
                .execute();
        }
        
        await this.bonusRepo.delete({ leagueId: this.DEMO_LEAGUE_ID });
        
        // Use query builder for league_id delete to be safer with uuid
        await this.participantRepo.createQueryBuilder()
            .delete()
            .where('league_id = :leagueId', { leagueId: this.DEMO_LEAGUE_ID })
            .execute();
            
        console.log('✅ Demo Data Cleared.');
    } catch (error) {
        console.error('❌ Error clearing demo data:', error);
        // We don't throw here to allow provisioning to try anyway
    }
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
