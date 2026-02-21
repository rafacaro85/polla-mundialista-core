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

  async diagnoseSchema(key: string) {
    const SECRET = process.env.ADMIN_SECRET || 'POLLA_ADMIN_2026_MIGRATE';
    if (key !== SECRET) {
      throw new Error('Unauthorized');
    }

    const results: Record<string, any> = {};

    // 1. Check columns in league_participants
    const lpCols = await this.dataSource.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'league_participants'
      ORDER BY ordinal_position
    `);
    results.league_participants_columns = lpCols;

    // 2. Check columns in leagues
    const lCols = await this.dataSource.query(`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'leagues'
      ORDER BY ordinal_position
    `);
    results.leagues_columns = lCols;

    // 3. Check enum types
    const enumTypes = await this.dataSource.query(`
      SELECT t.typname, e.enumlabel
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      WHERE t.typname LIKE '%league%' OR t.typname LIKE '%status%'
      ORDER BY t.typname, e.enumsortorder
    `);
    results.enum_types = enumTypes;

    // 4. Try a test insert/rollback to catch the exact PG error
    try {
      await this.dataSource.query('BEGIN');
      await this.dataSource.query(`
        INSERT INTO league_participants
          (id, league_id, user_id, total_points, "isAdmin", is_blocked,
           trivia_points, prediction_points, bracket_points, joker_points,
           joined_at, status, is_paid)
        VALUES
          (gen_random_uuid(),
           (SELECT id FROM leagues LIMIT 1),
           (SELECT id FROM users LIMIT 1),
           0, false, false, 0, 0, 0, 0,
           NOW(), 'ACTIVE', false)
      `);
      await this.dataSource.query('ROLLBACK');
      results.test_insert = 'SUCCESS (rolled back)';
    } catch (err) {
      await this.dataSource.query('ROLLBACK').catch(() => {});
      results.test_insert = `FAILED: ${err.message} | detail: ${err.detail || 'none'} | code: ${err.code || 'none'}`;
    }

    // 5. Test the actual league SELECT query (same as getMyLeagues)
    try {
      const testSelect = await this.dataSource.query(`
        SELECT 
          l.id, l.name, l."tournamentId", l."maxParticipants",
          l.status, l.is_paid, l.package_type, l.is_enterprise
        FROM leagues l
        LIMIT 1
      `);
      results.test_select_leagues = testSelect.length > 0 ? 'SUCCESS: ' + JSON.stringify(testSelect[0]) : 'SUCCESS: no rows';
    } catch (err) {
      results.test_select_leagues = `FAILED: ${err.message} | detail: ${err.detail || 'none'}`;
    }

    // 6. Test league INSERT (same as createLeague does)
    try {
      await this.dataSource.query('BEGIN');
      await this.dataSource.query(`
        INSERT INTO leagues
          (id, name, type, "maxParticipants", creator_id, is_paid,
           package_type, is_enterprise, is_enterprise_active,
           "tournamentId", status, prize_type)
        VALUES
          (gen_random_uuid(), 'TEST_DIAG', 'FAMILIA',
           10, (SELECT id FROM users LIMIT 1),
           false, 'familia', false, false,
           'WC2026', 'ACTIVE', 'image')
      `);
      await this.dataSource.query('ROLLBACK');
      results.test_insert_league = 'SUCCESS (rolled back)';
    } catch (err) {
      await this.dataSource.query('ROLLBACK').catch(() => {});
      results.test_insert_league = `FAILED: ${err.message} | detail: ${err.detail || 'none'} | code: ${err.code || 'none'}`;
    }

    return results;
  }

  async runMigration(key: string) {
    const SECRET = process.env.ADMIN_SECRET || 'POLLA_ADMIN_2026_MIGRATE';
    if (key !== SECRET) throw new Error('Unauthorized');

    const sql = `
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'league_participants_status_enum') THEN
        CREATE TYPE "league_participants_status_enum" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');
    END IF;
END $$;
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'league_participants' AND column_name = 'status') THEN
        ALTER TABLE "league_participants"
        ADD COLUMN "status" "league_participants_status_enum" DEFAULT 'ACTIVE';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'league_participants' AND column_name = 'is_paid') THEN
        ALTER TABLE "league_participants"
        ADD COLUMN "is_paid" boolean DEFAULT false;
    END IF;
END $$;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leagues' AND column_name = 'prize_type') THEN
        ALTER TABLE "leagues" ADD COLUMN "prize_type" varchar DEFAULT 'image';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'leagues' AND column_name = 'prize_amount') THEN
        ALTER TABLE "leagues" ADD COLUMN "prize_amount" decimal(15,2);
    END IF;
END $$;
    `;

    try {
      await this.dataSource.query(sql);
      return { success: true, message: '✅ Migration applied' };
    } catch (error) {
      return { success: false, message: `❌ ${error.message}` };
    }
  }
}
