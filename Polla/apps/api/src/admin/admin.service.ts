import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';

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

  async seedUCLMatchesKnockouts() {
    try {
      // 1. Delete Corrupt Data for UCL2526 Knockout phases only
      await this.dataSource.query(`
        DELETE FROM "matches" 
        WHERE "tournamentId" = 'UCL2526' 
        AND "phase" IN ('ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL');
      `);

      // 2. Insert new 25 matches exactly as required
      await this.dataSource.query(`
        -- OCTAVOS DE FINAL (IDA)
        INSERT INTO "matches" ("id", "tournamentId", "homeTeam", "awayTeam", "date", "status", "phase", "homeFlag", "awayFlag", "bracketId", "group") VALUES 
        (gen_random_uuid(), 'UCL2526', 'Galatasaray', 'Liverpool', '2026-03-10 17:45:00', 'PENDING', 'ROUND_16', 'galatasaray', 'liverpool', 1, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Atalanta', 'Bayern München', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 'atalanta', 'bayern_munchen', 2, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Newcastle', 'Barcelona', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 'newcastle', 'barcelona', 3, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Atlético Madrid', 'Tottenham', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 'atletico_madrid', 'tottenham', 4, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Leverkusen', 'Arsenal', '2026-03-11 17:45:00', 'PENDING', 'ROUND_16', 'leverkusen', 'arsenal', 5, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'PSG', 'Chelsea', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 'psg', 'chelsea', 6, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Real Madrid', 'Manchester City', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 'real_madrid', 'manchester_city', 7, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Bodø/Glimt', 'Sporting CP', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 'bodo_glimt', 'sporting_cp', 8, 'LEG_1');

        -- OCTAVOS DE FINAL (VUELTA)
        INSERT INTO "matches" ("id", "tournamentId", "homeTeam", "awayTeam", "date", "status", "phase", "homeFlag", "awayFlag", "bracketId", "group") VALUES 
        (gen_random_uuid(), 'UCL2526', 'Sporting CP', 'Bodø/Glimt', '2026-03-17 17:45:00', 'PENDING', 'ROUND_16', 'sporting_cp', 'bodo_glimt', 8, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Chelsea', 'PSG', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 'chelsea', 'psg', 6, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Manchester City', 'Real Madrid', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 'manchester_city', 'real_madrid', 7, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Arsenal', 'Leverkusen', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 'arsenal', 'leverkusen', 5, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Barcelona', 'Newcastle', '2026-03-18 17:45:00', 'PENDING', 'ROUND_16', 'barcelona', 'newcastle', 3, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Liverpool', 'Galatasaray', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 'liverpool', 'galatasaray', 1, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Bayern München', 'Atalanta', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 'bayern_munchen', 'atalanta', 2, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Atlético Madrid', 'Tottenham', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 'atletico_madrid', 'tottenham', 4, 'LEG_2');

        -- CUARTOS DE FINAL (IDA Y VUELTA)
        INSERT INTO "matches" ("id", "tournamentId", "homeTeam", "awayTeam", "date", "status", "phase", "homeFlag", "awayFlag", "bracketId", "group") VALUES 
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-08 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 9, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-08 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 10, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-09 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 11, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-09 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 12, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-15 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 9, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-15 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 10, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-16 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 11, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-16 20:00:00', 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd', 12, 'LEG_2');

        -- SEMIFINALES Y FINAL (TBD)
        INSERT INTO "matches" ("id", "tournamentId", "homeTeam", "awayTeam", "date", "status", "phase", "homeFlag", "awayFlag", "bracketId", "group") VALUES 
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-28 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 13, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-04-29 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 14, 'LEG_1'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-05-05 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 13, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-05-06 20:00:00', 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd', 14, 'LEG_2'),
        (gen_random_uuid(), 'UCL2526', 'Por definir', 'Por definir', '2026-05-31 20:00:00', 'PENDING', 'FINAL', 'tbd', 'tbd', 15, 'SINGLE_LEG');
      `);

      return {
        success: true,
        message: 'Deleted corrupt UCL2526 knockout matches and seeded new 25 correct matches.',
      };
    } catch (error) {
      return {
        success: false,
        message: `Error seeding UCL KO: ${error.message}`,
        error: error.message,
      };
    }
  }
}

