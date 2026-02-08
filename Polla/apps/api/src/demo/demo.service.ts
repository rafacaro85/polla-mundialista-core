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
import { TournamentService } from '../tournament/tournament.service';
import * as bcrypt from 'bcrypt';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DemoService {
  private readonly DEMO_ENTERPRISE_LEAGUE_ID = '00000000-0000-0000-0000-000000001337'; // Enterprise Demo
  private readonly DEMO_SOCIAL_LEAGUE_ID = '00000000-0000-0000-0000-000000001338'; // Social Demo
  private readonly DEMO_ADMIN_EMAIL = 'demo@lapollavirtual.com';
  private readonly DEMO_SOCIAL_ADMIN_EMAIL = 'demo-social@lapollavirtual.com';
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
    private tournamentService: TournamentService,
    private eventEmitter: EventEmitter2,
  ) {}

  async provisionEnterpriseDemo() {
    return this.provisionDemo(this.DEMO_ENTERPRISE_LEAGUE_ID, this.DEMO_ADMIN_EMAIL, true);
  }

  async provisionSocialDemo() {
    return this.provisionDemo(this.DEMO_SOCIAL_LEAGUE_ID, this.DEMO_SOCIAL_ADMIN_EMAIL, false);
  }

  private async provisionDemo(leagueId: string, adminEmail: string, isEnterprise: boolean) {
    try {
        console.log('🚀 Provisioning Demo Environment...');

        // 1. Create or Update Demo Admin
        let admin = await this.userRepo.findOne({ where: { email: adminEmail } });
        if (!admin) {
          const hashedPassword = await bcrypt.hash('demo123', 10);
          admin = this.userRepo.create({
            email: adminEmail,
            fullName: isEnterprise ? 'Admin Demo Empresa' : 'Admin Demo Social',
            nickname: isEnterprise ? 'AdminEmpresa' : 'AdminSocial',
            password: hashedPassword,
            role: UserRole.PLAYER,
            isVerified: true,
          });
          admin = await this.userRepo.save(admin);
        }

        // 2. Create Demo League
        let league = await this.leagueRepo.findOne({ where: { id: leagueId } });
        if (league) {
            // Clear existing demo data before re-provisioning
            await this.clearDemoData(leagueId);
        } else {
            league = new League();
            league.id = leagueId;
        }

        // Set properties based on demo type
        if (isEnterprise) {
            league.name = 'Demo Corporativa Mundial 2026';
            league.type = LeagueType.COMPANY;
            league.packageType = 'diamond';
            league.isEnterprise = true;
            league.isEnterpriseActive = true;
            league.maxParticipants = 100;
            league.companyName = 'Empresa Demo S.A.';
            league.brandColorPrimary = '#4F46E5';
            league.brandColorBg = '#0F172A';
            league.brandColorSecondary = '#1E293B';
            league.brandColorText = '#F8FAFC';
            league.welcomeMessage = '¡Bienvenido al Demo Empresarial! Aquí puedes ver cómo tus empleados vivirán el mundial.';
        } else {
            league.name = 'Demo Social - Mundial 2026';
            league.type = LeagueType.LIBRE;
            league.packageType = 'free';
            league.isEnterprise = false;
            league.isEnterpriseActive = false;
            league.maxParticipants = 20;
            league.brandColorPrimary = '#10B981'; // Green
            league.brandColorBg = '#0F172A';
            league.brandColorSecondary = '#1E293B';
            league.brandColorText = '#F8FAFC';
            league.welcomeMessage = '¡Bienvenido al Demo Social! Compite con tus amigos y familia en este mundial.';
        }
        
        league.creator = admin;
        league.accessCodePrefix = isEnterprise ? 'DEMO-EMP' : 'DEMO-SOC';
        league.tournamentId = this.TOURNAMENT_ID;
        league.brandingLogoUrl = undefined;
        league.prizeImageUrl = undefined;
        league.isPaid = true;

        league = await this.leagueRepo.save(league);

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
                where: { league: { id: leagueId }, user: { id: user.id } } 
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

        // 5. Create Mock Predictions for ALL Group Stage Matches
        const groupMatches = await this.matchRepo.find({
            where: { tournamentId: this.TOURNAMENT_ID, phase: 'GROUP' },
        });

        console.log(`📝 Creating predictions for ${groupMatches.length} group matches for ${mockUsers.length} users...`);

        for (const user of mockUsers) {
            for (const match of groupMatches) {
                // Ensure unique predictions
                const existingPred = await this.predictionRepo.findOne({
                    where: { user: { id: user.id }, match: { id: match.id }, leagueId: leagueId }
                });
                
                if (!existingPred) {
                    await this.predictionRepo.save(this.predictionRepo.create({
                        user,
                        match,
                        leagueId: leagueId,
                        homeScore: Math.floor(Math.random() * 4),
                        awayScore: Math.floor(Math.random() * 4),
                        points: 0, // Points will be calculated when match finishes
                        isJoker: Math.random() > 0.9, // 10% chance of joker
                    }));
                }
            }
        }

        console.log(`✅ Predictions created for demo league ${leagueId}`);

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

  async clearDemoData(leagueId?: string) {
    const targetLeagueId = leagueId || this.DEMO_ENTERPRISE_LEAGUE_ID;
    try {
        console.log(`🧹 Clearing Demo Data for league ${targetLeagueId}...`);
        await this.predictionRepo.delete({ leagueId: targetLeagueId });
        
        const questions = await this.bonusRepo.find({ where: { leagueId: targetLeagueId } });
        if (questions.length > 0) {
            const qIds = questions.map(q => q.id);
            await this.bonusAnswerRepo.createQueryBuilder()
                .delete()
                .where('questionId IN (:...qIds)', { qIds })
                .execute();
        }
        
        await this.bonusRepo.delete({ leagueId: targetLeagueId });
        
        // Use query builder for league_id delete to be safer with uuid
        await this.participantRepo.createQueryBuilder()
            .delete()
            .where('league_id = :leagueId', { leagueId: targetLeagueId })
            .execute();
            
        // ALSO RESET MATCH RESULTS for the Demo Tournament (only once, not per league)
        if (leagueId === this.DEMO_ENTERPRISE_LEAGUE_ID || !leagueId) {
            await this.resetTournamentResults();
        }

        console.log('✅ Demo Data Cleared.');
    } catch (error) {
        console.error('❌ Error clearing demo data:', error);
        // We don't throw here to allow provisioning to try anyway
    }
  }

  async resetTournamentResults() {
      console.log('🔄 Resetting Tournament Match Results...');
      await this.matchRepo.createQueryBuilder()
          .update(Match)
          .set({ 
              homeScore: null, 
              awayScore: null, 
              status: 'PENDING' 
          })
          .where('tournamentId = :tournamentId', { tournamentId: this.TOURNAMENT_ID })
          .execute();
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

    // Use MatchesService.finishMatch to properly calculate points
    await this.matchesService.finishMatch(pendingMatch.id, h, a);

    console.log(`⚽ Simulated: ${pendingMatch.homeTeam} ${h} - ${a} ${pendingMatch.awayTeam}`);

    return { 
        success: true, 
        match: `${pendingMatch.homeTeam} ${h} - ${a} ${pendingMatch.awayTeam}`,
        phase: pendingMatch.phase 
    };
  }

  async simulateBatch(count: number = 5) {
      const results = [];
      let lastPhase = null;
      
      for (let i = 0; i < count; i++) {
          try {
              const res = await this.simulateNextMatch();
              results.push(res);
              lastPhase = res.phase;
          } catch (e) {
              break; // No more matches
          }
      }

      // Check if we just finished the group stage
      if (lastPhase === 'GROUP') {
          try {
              console.log('🔄 Checking for completed groups to promote...');
              await this.tournamentService.promoteAllCompletedGroups();
              console.log('✅ Group promotions completed');
          } catch (err) {
              console.error('❌ Error promoting groups:', err);
          }
      }

      return { success: true, count: results.length, lastMatch: results[results.length - 1] };
  }

  async createBonus(text: string, points: number, leagueId?: string) {
      const targetLeagueId = leagueId || this.DEMO_ENTERPRISE_LEAGUE_ID;
      const bonus = this.bonusRepo.create({
          text,
          points,
          leagueId: targetLeagueId,
          tournamentId: this.TOURNAMENT_ID,
          isActive: true,
      });
      return this.bonusRepo.save(bonus);
  }
}
