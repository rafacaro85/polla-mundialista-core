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
import { SystemConfig } from '../database/entities/system-config.entity';



@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    @InjectRepository(KnockoutPhaseStatus)
    private phaseStatusRepository: Repository<KnockoutPhaseStatus>,
    private dataSource: DataSource,
  ) {}

  async seedHeimcore() {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('🧹 [Heimcore Seed] Iniciando limpieza de tablas...');

      // Limpieza drástica (Delete para evitar problemas de constraints si no hay Truncate Cascade)
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

      // 1. Torneo / Referencia Heimcore (No hay entidad Tournament, se usa ID)
      const TOURNAMENT_ID = 'HEIMCORE';

      // 2. Crear Partido Único: Croacia vs Colombia
      const match = queryRunner.manager.create(Match, {
        tournamentId: TOURNAMENT_ID,
        homeTeam: 'Croacia',
        awayTeam: 'Colombia',
        homeFlag: 'https://flagcdn.com/w80/hr.png',
        awayFlag: 'https://flagcdn.com/w80/co.png',
        date: new Date('2026-03-26T20:00:00Z'), // Fecha solicitada
        phase: 'AMISTOSO',
        group: 'UNICO',
        stadium: 'TBD',
        status: 'SCHEDULED',
        isManuallyLocked: false,
      });
      await queryRunner.manager.save(match);
      console.log('✅ [Heimcore Seed] Partido Croacia vs Colombia creado.');

      // 3. Crear 2 Trivias (Bonus Questions)
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
      console.log('✅ [Heimcore Seed] 2 Trivias creadas.');

      // 4. Buscar o crear un usuario administrador para la liga
      // (Buscamos el primer usuario o uno de sistema)
      let admin = await queryRunner.manager.findOne(User, { where: {} });
      if (!admin) {
        admin = queryRunner.manager.create(User, {
          email: 'admin@heimcore.com',
          fullName: 'Heimcore Admin',
          role: UserRole.ADMIN,
          isVerified: true
        });
        await queryRunner.manager.save(admin);
      }

      // 5. Crear Liga Corporativa Heimcore
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
        brandColorSecondary: '#1E293B',
        accessCodePrefix: 'HEIM'
      });
      await queryRunner.manager.save(league);
      console.log('✅ [Heimcore Seed] Liga Corporativa Heimcore creada.');

      await queryRunner.commitTransaction();

      return {
        success: true,
        message: 'Entorno reciclado exitosamente para Heimcore.',
        match: 'Croacia vs Colombia',
        league: 'Heimcore (30 users)',
        trivias: 2
      };
    } catch (error) {
      console.error('❌ Error en Seed Heimcore:', error);
      await queryRunner.rollbackTransaction();
      return { success: false, error: error.message };
    } finally {
      await queryRunner.release();
    }
  }




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

  async reseedUCLMatches() {
    try {
      await this.dataSource.query(`
        DELETE FROM matches 
        WHERE "tournamentId" = 'UCL2526' 
        AND phase IN ('ROUND_16','QUARTER_FINAL','SEMI_FINAL','FINAL', 'QUARTER', 'SEMI')
      `);

      const getLogo = (team: string): string => {
        const FLAGS: Record<string, string> = {
          'PSG': '/images/escudos/psg.svg',
          'Chelsea': '/images/escudos/chelsea-footballlogos-org.svg',
          'Galatasaray': '/images/escudos/galatasaray-footballlogos-org.svg',
          'Liverpool': '/images/escudos/liverpool-fc-footballlogos-org.svg',
          'Real Madrid': '/images/escudos/real-madrid-footballlogos-org.svg',
          'Manchester City': '/images/escudos/manchester-city-footballlogos-org.svg',
          'Atalanta': '/images/escudos/atalanta-footballlogos-org.svg',
          'Bayern Munich': '/images/escudos/bayern-munich-footballlogos-org.svg',
          'Newcastle': '/images/escudos/newcastle-united-footballlogos-org.svg',
          'Barcelona': '/images/escudos/fc-barcelona-footballlogos-org.svg',
          'Atlético de Madrid': '/images/escudos/atletico-madrid-footballlogos-org.svg',
          'Tottenham': '/images/escudos/tottenham-hotspur-footballlogos-org.svg',
          'Bodø/Glimt': '/images/escudos/bodo-glimt-footballlogos-org.svg',
          'Sporting CP': '/images/escudos/sporting-cp-portugal-footballlogos-org.svg',
          'Bayer Leverkusen': '/images/escudos/bayer-leverkusen-footballlogos-org.svg',
          'Arsenal': '/images/escudos/arsenal-footballlogos-org.svg'
        };
        return FLAGS[team] || '';
      };

      const MATCHES_R16 = [
        // ====== IDA ======
        // Martes 10 marzo 2026
        { date: '2026-03-10T17:45:00Z', home: 'Galatasaray', away: 'Liverpool', stadium: 'RAMS Park', bracketId: 2, leg: 'LEG_1' },
        { date: '2026-03-10T20:00:00Z', home: 'Atalanta', away: 'Bayern Munich', stadium: 'Gewiss Stadium', bracketId: 4, leg: 'LEG_1' },
        { date: '2026-03-10T20:00:00Z', home: 'Newcastle', away: 'Barcelona', stadium: 'St James Park', bracketId: 5, leg: 'LEG_1' },
        { date: '2026-03-10T20:00:00Z', home: 'Atlético de Madrid', away: 'Tottenham', stadium: 'Metropolitano', bracketId: 6, leg: 'LEG_1' },
        
        // Miércoles 11 marzo 2026
        { date: '2026-03-11T17:45:00Z', home: 'Bayer Leverkusen', away: 'Arsenal', stadium: 'BayArena', bracketId: 8, leg: 'LEG_1' },
        { date: '2026-03-11T20:00:00Z', home: 'PSG', away: 'Chelsea', stadium: 'Parc des Princes', bracketId: 1, leg: 'LEG_1' },
        { date: '2026-03-11T20:00:00Z', home: 'Real Madrid', away: 'Manchester City', stadium: 'Santiago Bernabéu', bracketId: 3, leg: 'LEG_1' },
        { date: '2026-03-11T20:00:00Z', home: 'Bodø/Glimt', away: 'Sporting CP', stadium: 'Aspmyra Stadion', bracketId: 7, leg: 'LEG_1' },

        // ====== VUELTA ======
        // Martes 17 marzo 2026
        { date: '2026-03-17T20:00:00Z', home: 'Arsenal', away: 'Bayer Leverkusen', stadium: 'Emirates Stadium', bracketId: 8, leg: 'LEG_2' },
        { date: '2026-03-17T20:00:00Z', home: 'Chelsea', away: 'PSG', stadium: 'Stamford Bridge', bracketId: 1, leg: 'LEG_2' },
        { date: '2026-03-17T20:00:00Z', home: 'Manchester City', away: 'Real Madrid', stadium: 'Etihad Stadium', bracketId: 3, leg: 'LEG_2' },
        { date: '2026-03-17T20:00:00Z', home: 'Sporting CP', away: 'Bodø/Glimt', stadium: 'José Alvalade', bracketId: 7, leg: 'LEG_2' },

        // Miércoles 18 marzo 2026
        { date: '2026-03-18T18:45:00Z', home: 'Liverpool', away: 'Galatasaray', stadium: 'Anfield', bracketId: 2, leg: 'LEG_2' },
        { date: '2026-03-18T20:00:00Z', home: 'Bayern Munich', away: 'Atalanta', stadium: 'Allianz Arena', bracketId: 4, leg: 'LEG_2' },
        { date: '2026-03-18T20:00:00Z', home: 'Barcelona', away: 'Newcastle', stadium: 'Spotify Camp Nou', bracketId: 5, leg: 'LEG_2' },
        { date: '2026-03-18T20:00:00Z', home: 'Tottenham', away: 'Atlético de Madrid', stadium: 'Tottenham Hotspur Stadium', bracketId: 6, leg: 'LEG_2' },
      ];

      let insertedCount = 0;
      for (const m of MATCHES_R16) {
        const match = this.matchRepository.create({
          tournamentId: 'UCL2526', homeTeam: m.home, awayTeam: m.away, homeFlag: getLogo(m.home), awayFlag: getLogo(m.away), 
          date: new Date(m.date), phase: 'ROUND_16', group: m.leg, bracketId: m.bracketId, stadium: m.stadium, status: 'SCHEDULED', isManuallyLocked: false
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      // ===========================================
      // QUARTER_FINAL — 6/8 abr (ida) & 13/15 abr (vuelta)
      // ===========================================
      const QF_MATCHES = [
        // LEG_1 (Ida) — 1 y 2 de abril
        { bracketId: 9,  leg: 'LEG_1', date: '2026-04-08T20:00:00Z', homePh: 'PSG/CHE',  awayPh: 'GAL/LIV' },
        { bracketId: 10, leg: 'LEG_1', date: '2026-04-08T20:00:00Z', homePh: 'RMA/MCI', awayPh: 'ATA/BAY' },
        { bracketId: 11, leg: 'LEG_1', date: '2026-04-07T20:00:00Z', homePh: 'NEW/BAR', awayPh: 'ATM/TOT' },
        { bracketId: 12, leg: 'LEG_1', date: '2026-04-07T20:00:00Z', homePh: 'BOD/SPO', awayPh: 'LEV/ARS' },
        // LEG_2 (Vuelta) — 13/15 abr
        { bracketId: 9,  leg: 'LEG_2', date: '2026-04-15T20:00:00Z', homePh: 'GAL/LIV', awayPh: 'PSG/CHE' },
        { bracketId: 10, leg: 'LEG_2', date: '2026-04-15T20:00:00Z', homePh: 'ATA/BAY', awayPh: 'RMA/MCI' },
        { bracketId: 11, leg: 'LEG_2', date: '2026-04-14T20:00:00Z', homePh: 'ATM/TOT', awayPh: 'NEW/BAR' },
        { bracketId: 12, leg: 'LEG_2', date: '2026-04-14T20:00:00Z', homePh: 'LEV/ARS', awayPh: 'BOD/SPO' },
      ];
      for (const m of QF_MATCHES) {
        const match = this.matchRepository.create({
          tournamentId: 'UCL2526', homeTeam: '', awayTeam: '',
          homeTeamPlaceholder: m.homePh, awayTeamPlaceholder: m.awayPh,
          date: new Date(m.date), phase: 'QUARTER_FINAL', bracketId: m.bracketId,
          group: m.leg, stadium: 'TBD', status: 'PENDING', isManuallyLocked: false
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      // ===========================================
      // SEMI_FINAL — 27/29 abr (ida) & 4/6 may (vuelta)
      // ===========================================
      const SF_MATCHES = [
        // LEG_1 (Ida) — 29 abr
        { bracketId: 13, leg: 'LEG_1', date: '2026-04-29T20:00:00Z', homePh: 'G. Cuartos 1', awayPh: 'G. Cuartos 2' },
        { bracketId: 14, leg: 'LEG_1', date: '2026-04-28T20:00:00Z', homePh: 'G. Cuartos 3', awayPh: 'G. Cuartos 4' },
        // LEG_2 (Vuelta) — 6 y 5 may
        { bracketId: 13, leg: 'LEG_2', date: '2026-05-06T20:00:00Z', homePh: 'G. Cuartos 2', awayPh: 'G. Cuartos 1' },
        { bracketId: 14, leg: 'LEG_2', date: '2026-05-05T20:00:00Z', homePh: 'G. Cuartos 4', awayPh: 'G. Cuartos 3' },
      ];
      for (const m of SF_MATCHES) {
        const match = this.matchRepository.create({
          tournamentId: 'UCL2526', homeTeam: '', awayTeam: '',
          homeTeamPlaceholder: m.homePh, awayTeamPlaceholder: m.awayPh,
          date: new Date(m.date), phase: 'SEMI_FINAL', bracketId: m.bracketId,
          group: m.leg, stadium: 'TBD', status: 'PENDING', isManuallyLocked: false
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      // ===========================================
      // FINAL — 30 mayo, Puskás Aréna Budapest
      // ===========================================
      const finalMatch = this.matchRepository.create({
        tournamentId: 'UCL2526', homeTeam: '', awayTeam: '',
        homeTeamPlaceholder: 'Finalista 1', awayTeamPlaceholder: 'Finalista 2',
        date: new Date('2026-05-30T20:00:00Z'), phase: 'FINAL', bracketId: 15,
        group: undefined, stadium: 'Puskás Aréna, Budapest', status: 'PENDING', isManuallyLocked: false
      });
      await this.matchRepository.save(finalMatch);
      insertedCount++;

      // ===========================================
      // ENLACE DE LLAVES (PROGRESIÓN DEL BRACKET)
      // ===========================================
      const qf = await this.dataSource.query(`SELECT id, "bracketId" FROM matches WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL' AND "group" = 'LEG_1'`);
      const sf = await this.dataSource.query(`SELECT id, "bracketId" FROM matches WHERE "tournamentId" = 'UCL2526' AND phase = 'SEMI_FINAL' AND "group" = 'LEG_1'`);
      const final = await this.dataSource.query(`SELECT id, "bracketId" FROM matches WHERE "tournamentId" = 'UCL2526' AND phase = 'FINAL'`);

      const linkPhase = async (targetMatches: any[], links: {src: number[], tgt: number}[], phaseParam: string) => {
        for (const link of links) {
          const targetNode = targetMatches.find(t => t.bracketId === link.tgt);
          if (targetNode) {
            await this.dataSource.query(`
              UPDATE matches SET "nextMatchId" = $1
              WHERE "tournamentId" = 'UCL2526' AND "bracketId" IN (${link.src.join(',')}) AND phase = '${phaseParam}' AND "group" = 'LEG_1'
            `, [targetNode.id]);
          }
        }
      };

      // R16 -> Quarters
      await linkPhase(qf, [
        { src: [1, 2], tgt: 9 }, { src: [3, 4], tgt: 10 },
        { src: [5, 6], tgt: 11 }, { src: [7, 8], tgt: 12 },
      ], 'ROUND_16');

      // Quarters -> Semis
      await linkPhase(sf, [
        { src: [9, 10], tgt: 13 }, { src: [11, 12], tgt: 14 }
      ], 'QUARTER_FINAL');

      // Semis -> Final
      await linkPhase(final, [
        { src: [13, 14], tgt: 15 }
      ], 'SEMI_FINAL');

      return { success: true, message: `Reseeded ${insertedCount} knockout matches for UCL2526 (Official Draw) con enlazado activo.` };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async fixUCLPhases() {
    await this.dataSource.query(`
      UPDATE "knockout_phase_status" 
      SET "is_unlocked" = true,
          "all_matches_completed" = true
      WHERE "tournamentId" = 'UCL2526'
      AND "phase" IN ('PLAYOFF_1', 'PLAYOFF_2')
    `);

    await this.dataSource.query(`
      UPDATE "knockout_phase_status"
      SET "is_unlocked" = true,
          "all_matches_completed" = false,
          "is_manually_locked" = false
      WHERE "tournamentId" = 'UCL2526'
      AND "phase" = 'ROUND_16'
    `);

    await this.dataSource.query(`
      INSERT INTO "knockout_phase_status" 
      ("id", "tournamentId", "phase", 
       "is_unlocked", "all_matches_completed",
       "is_manually_locked")
      VALUES 
      (gen_random_uuid(), 'UCL2526', 
       'ROUND_16', true, false, false)
      ON CONFLICT DO NOTHING
    `);

    return { success: true };
  }

  async getPlatformStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      usersTotal, usersActiveToday, usersNewThisWeek,
      leaguesTotal, leaguesActive, leaguesPendingPayment, leaguesByTournament,
      predictionsTotal,
      paymentsPending, paymentsApprovedThisMonth,
    ] = await Promise.all([
      this.dataSource.query(`SELECT COUNT(*) AS count FROM users`),
      this.dataSource.query(
        `SELECT COUNT(DISTINCT "userId") AS count FROM predictions
         JOIN transactions t ON t.user_id = predictions."userId"
         WHERE t.created_at >= $1`,
        [startOfToday],
      ),
      this.dataSource.query(
        `SELECT COUNT(*) AS count FROM users WHERE created_at >= $1`,
        [startOfWeek],
      ),
      this.dataSource.query(`SELECT COUNT(*) AS count FROM leagues`),
      this.dataSource.query(`SELECT COUNT(*) AS count FROM leagues WHERE is_paid = true`),
      this.dataSource.query(
        `SELECT COUNT(*) AS count FROM league_participants WHERE status = 'PENDING_PAYMENT'`,
      ),
      this.dataSource.query(
        `SELECT "tournamentId", COUNT(*) AS total,
                SUM(CASE WHEN is_paid = true THEN 1 ELSE 0 END) AS active
         FROM leagues GROUP BY "tournamentId"`,
      ),
      this.dataSource.query(`SELECT COUNT(*) AS count FROM predictions`),
      this.dataSource.query(`SELECT COUNT(*) AS count FROM transactions WHERE status = 'PENDING'`),
      this.dataSource.query(
        `SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS revenue
         FROM transactions WHERE status IN ('APPROVED', 'PAID') AND created_at >= $1`,
        [startOfMonth],
      ),
    ]);


    return {
      users: {
        total: Number(usersTotal[0]?.count ?? 0),
        activeToday: Number(usersActiveToday[0]?.count ?? 0),
        newThisWeek: Number(usersNewThisWeek[0]?.count ?? 0),
      },
      leagues: {
        total: Number(leaguesTotal[0]?.count ?? 0),
        active: Number(leaguesActive[0]?.count ?? 0),
        pendingPayment: Number(leaguesPendingPayment[0]?.count ?? 0),
        byTournament: leaguesByTournament.map((r: any) => ({
          tournamentId: r.tournamentId,
          total: Number(r.total),
          active: Number(r.active),
        })),
      },
      predictions: {
        total: Number(predictionsTotal[0]?.count ?? 0),
        today: 0, // predictions table has no created_at column
      },

      payments: {
        pendingCount: Number(paymentsPending[0]?.count ?? 0),
        approvedThisMonth: Number(paymentsApprovedThisMonth[0]?.count ?? 0),
        revenueThisMonth: Number(paymentsApprovedThisMonth[0]?.revenue ?? 0),
      },
    };
  }

  async setSystemConfig(key: string, value: string) {
    const repo = this.dataSource.getRepository(SystemConfig);
    let config = await repo.findOne({ where: { key } });
    if (!config) {
      config = repo.create({ key, value });
    } else {
      config.value = value;
    }
    await repo.save(config);
    return { success: true, key, value };
  }

  async getSystemConfig(key: string) {
    const repo = this.dataSource.getRepository(SystemConfig);
    const config = await repo.findOne({ where: { key } });
    return { success: true, key, value: config?.value || null };
  }

}


