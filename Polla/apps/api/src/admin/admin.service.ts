import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { League } from '../database/entities/league.entity';
import { LeagueType } from '../database/enums/league-type.enum';
import { BonusQuestion } from '../database/entities/bonus-question.entity';
import { User } from '../database/entities/user.entity';
import { LeagueStatus } from '../database/enums/league-status.enum';
import { UserRole } from '../database/enums/user-role.enum';


@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(KnockoutPhaseStatus)
    private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
    private dataSource: DataSource,
  ) {}

  async seedUCLMatches() {
    try {
      // Check if tables exist, if not, sync schema
      try {
        await this.dataSource.synchronize(); // Ensure schema is up to date (column tournamentId)
      } catch (error) {}

      // Check specifically for UCL2526 matches
      const count = await this.matchRepository.count({
        where: { tournamentId: 'UCL2526' },
      });

      if (count > 0) {
        return {
          success: false,
          message: `UCL Database not empty (${count} matches). Clear first if needed.`,
        };
      }

      const TEAMS: Record<string, string> = {
        'Manchester City': 'gb-eng',
        'Real Madrid': 'es',
        'Bayern Munich': 'de',
        Liverpool: 'gb-eng',
        'Inter Milan': 'it',
        Arsenal: 'gb-eng',
        Barcelona: 'es',
        PSG: 'fr',
        'Atletico Madrid': 'es',
        'Borussia Dortmund': 'de',
        'Bayer Leverkusen': 'de',
        Juventus: 'it',
        'AC Milan': 'it',
        Benfica: 'pt',
        'Aston Villa': 'gb-eng',
        PSV: 'nl',
      };

      const getLogo = (team: string): string => {
        const code = TEAMS[team];
        return code ? `https://flagcdn.com/w40/${code}.png` : '';
      };

      const MATCHES = [
        // PLAY-OFFS IDA (Feb 17-18, 2026)
        {
          date: '2026-02-17T20:00:00Z',
          home: 'Benfica',
          away: 'Real Madrid',
          group: 'PO',
          stadium: 'Estádio da Luz',
        },
        {
          date: '2026-02-17T20:00:00Z',
          home: 'AC Milan',
          away: 'Liverpool',
          group: 'PO',
          stadium: 'San Siro',
        },
        {
          date: '2026-02-17T20:00:00Z',
          home: 'PSV',
          away: 'Arsenal',
          group: 'PO',
          stadium: 'Philips Stadion',
        },
        {
          date: '2026-02-17T20:00:00Z',
          home: 'Club Brugge',
          away: 'Atletico Madrid',
          group: 'PO',
          stadium: 'Jan Breydel Stadium',
        },

        {
          date: '2026-02-18T20:00:00Z',
          home: 'Juventus',
          away: 'Manchester City',
          group: 'PO',
          stadium: 'Allianz Stadium',
        },
        {
          date: '2026-02-18T20:00:00Z',
          home: 'Bayer Leverkusen',
          away: 'Inter Milan',
          group: 'PO',
          stadium: 'BayArena',
        },
        {
          date: '2026-02-18T20:00:00Z',
          home: 'Sporting CP',
          away: 'Bayern Munich',
          group: 'PO',
          stadium: 'Estádio José Alvalade',
        },
        {
          date: '2026-02-18T20:00:00Z',
          home: 'Feyenoord',
          away: 'PSG',
          group: 'PO',
          stadium: 'De Kuip',
        },

        // PLAY-OFFS VUELTA (Feb 24-25, 2026)
        {
          date: '2026-02-24T20:00:00Z',
          home: 'Real Madrid',
          away: 'Benfica',
          group: 'PO',
          stadium: 'Santiago Bernabéu',
        },
        {
          date: '2026-02-24T20:00:00Z',
          home: 'Liverpool',
          away: 'AC Milan',
          group: 'PO',
          stadium: 'Anfield',
        },
        {
          date: '2026-02-24T20:00:00Z',
          home: 'Arsenal',
          away: 'PSV',
          group: 'PO',
          stadium: 'Emirates Stadium',
        },
        {
          date: '2026-02-24T20:00:00Z',
          home: 'Atletico Madrid',
          away: 'Club Brugge',
          group: 'PO',
          stadium: 'Metropolitano',
        },

        {
          date: '2026-02-25T20:00:00Z',
          home: 'Manchester City',
          away: 'Juventus',
          group: 'PO',
          stadium: 'Etihad Stadium',
        },
        {
          date: '2026-02-25T20:00:00Z',
          home: 'Inter Milan',
          away: 'Bayer Leverkusen',
          group: 'PO',
          stadium: 'San Siro',
        },
        {
          date: '2026-02-25T20:00:00Z',
          home: 'Bayern Munich',
          away: 'Sporting CP',
          group: 'PO',
          stadium: 'Allianz Arena',
        },
        {
          date: '2026-02-25T20:00:00Z',
          home: 'PSG',
          away: 'Feyenoord',
          group: 'PO',
          stadium: 'Parc des Princes',
        },
      ];

      let insertedCount = 0;
      for (const matchData of MATCHES) {
        const match = this.matchRepository.create({
          homeTeam: matchData.home,
          awayTeam: matchData.away,
          homeFlag: getLogo(matchData.home),
          awayFlag: getLogo(matchData.away),
          date: new Date(matchData.date),
          group: matchData.group,
          phase: 'PLAYOFF', // Modified to Singular standard
          tournamentId: 'UCL2526', // CRITICAL: Tag as Champions
          stadium: matchData.stadium,
          homeScore: null,
          awayScore: null,
          status: 'SCHEDULED',
          isManuallyLocked: false,
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      // UNLOCK PLAYOFF PHASE FOR UCL2526
      const existingStatus = await this.phaseStatusRepository.findOne({
        where: { phase: 'PLAYOFF', tournamentId: 'UCL2526' },
      });
      if (!existingStatus) {
        await this.phaseStatusRepository.save({
          phase: 'PLAYOFF',
          tournamentId: 'UCL2526',
          isUnlocked: true, // Auto-unlock for visibility
          allMatchesCompleted: false,
        });
        console.log('✅ Unlocked PLAYOFF phase for UCL2526');
      }

      return {
        success: true,
        message: `UCL Beta seeded successfully: ${insertedCount} matches in 'PLAYOFF' phase.`,
        count: insertedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Error seeding UCL: ${error.message}`,
        error: error.message,
      };
    }
  }

  async seedHeimcore() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🧹 [Heimcore Seed] Iniciando limpieza de tablas de PEOPLE...');

      // Limpieza de datos (ROWS) para empezar de cero con Heimcore
      // Borramos lo que sea basura de pruebas anteriores según lo pedido.
      const tables = [
        'user_bonus_answers',
        'predictions',
        'user_brackets',
        'league_participants',
        'league_comments',
        'league_prizes',
        'league_banners',
        'access_codes',
        'bonus_questions',
        'leagues',
        'matches',
        'notifications',
        'transactions'
      ];

      for (const table of tables) {
        await queryRunner.query(`DELETE FROM "${table}"`);
      }

      console.log('✅ [Heimcore Seed] Limpieza completada.');

      const TOURNAMENT_ID = 'HEIMCORE';

      // 2. Partido Único
      const match = queryRunner.manager.create(Match, {
        tournamentId: TOURNAMENT_ID,
        homeTeam: 'Croacia',
        awayTeam: 'Colombia',
        homeFlag: 'https://flagcdn.com/w80/hr.png',
        awayFlag: 'https://flagcdn.com/w80/co.png',
        date: new Date('2026-03-26T20:00:00Z'),
        phase: 'AMISTOSO',
        group: 'UNICO',
        stadium: 'TBD',
        status: 'SCHEDULED',
        isManuallyLocked: false,
      });
      await queryRunner.manager.save(match);

      // 3. Trivias (Bonus Questions)
      const trivia1 = queryRunner.manager.create(BonusQuestion, {
        text: '¿Quién anotará el primer gol?',
        points: 10,
        tournamentId: TOURNAMENT_ID,
        isActive: true,
        type: 'OPEN'
      });
      const trivia2 = queryRunner.manager.create(BonusQuestion, {
        text: '¿Habrá tarjetas rojas?',
        points: 5,
        tournamentId: TOURNAMENT_ID,
        isActive: true,
        type: 'OPEN'
      });
      await queryRunner.manager.save([trivia1, trivia2]);

      // 4. Admin
      let admin = await queryRunner.manager.findOne(User, { where: { role: UserRole.SUPER_ADMIN } });
      if (!admin) {
        admin = await queryRunner.manager.findOne(User, { where: {} });
      }

      if (!admin) {
        throw new Error('No se encontró ningún usuario para asignar como creador de la liga Heimcore.');
      }

      // 5. Liga Heimcore
      const league = queryRunner.manager.create(League, {
        name: 'Heimcore',
        tournamentId: TOURNAMENT_ID,
        type: LeagueType.COMPANY,
        creator: admin,
        maxParticipants: 30,
        status: LeagueStatus.ACTIVE,
        isPaid: true,
        isEnterprise: true,
        isEnterpriseActive: true,
        packageType: 'ENTERPRISE',
        companyName: 'Heimcore',
        brandColorPrimary: '#00E676',
        accessCodePrefix: 'HEIM'
      });
      await queryRunner.manager.save(league);

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Entorno reciclado para Heimcore.',
        details: { match: 'Croacia vs Colombia', league: 'Heimcore', trivias: 2 }
      };
    } catch (error) {
      console.error('❌ Error Seed Heimcore:', error);
      await queryRunner.rollbackTransaction();
      return { success: false, error: error.message };
    } finally {
      await queryRunner.release();
    }
  }
}
