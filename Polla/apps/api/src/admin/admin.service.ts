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

  async reseedUCLMatches() {
    try {
      await this.dataSource.query(`
        DELETE FROM matches 
        WHERE "tournamentId" = 'UCL2526' 
        AND phase IN ('ROUND_16','QUARTER_FINAL','SEMI_FINAL','FINAL', 'QUARTER', 'SEMI')
      `);

      const getLogo = (team: string): string => {
        const TEAMS: Record<string, string> = {
          'Manchester City': 'gb-eng', 'Real Madrid': 'es', 'Bayern Munich': 'de', Liverpool: 'gb-eng',
          'Inter Milan': 'it', Arsenal: 'gb-eng', Barcelona: 'es', PSG: 'fr', 'Atletico Madrid': 'es',
          'Borussia Dortmund': 'de', 'Bayer Leverkusen': 'de', Juventus: 'it', 'AC Milan': 'it',
          Benfica: 'pt', 'Aston Villa': 'gb-eng', PSV: 'nl'
        };
        const code = TEAMS[team];
        return code ? `https://flagcdn.com/w40/${code}.png` : '';
      };

      const MATCHES_R16 = [
        // IDA
        { date: '2026-02-17T20:00:00Z', home: 'PSV', away: 'Arsenal', stadium: 'Philips Stadion', bracketId: 1 },
        { date: '2026-02-17T20:00:00Z', home: 'Benfica', away: 'Real Madrid', stadium: 'Estádio da Luz', bracketId: 2 },
        { date: '2026-02-18T20:00:00Z', home: 'Juventus', away: 'Manchester City', stadium: 'Allianz Stadium', bracketId: 3 },
        { date: '2026-02-18T20:00:00Z', home: 'AC Milan', away: 'Liverpool', stadium: 'San Siro', bracketId: 4 },
        { date: '2026-02-24T20:00:00Z', home: 'Atletico Madrid', away: 'Bayern Munich', stadium: 'Metropolitano', bracketId: 5 },
        { date: '2026-02-24T20:00:00Z', home: 'Bayer Leverkusen', away: 'Inter Milan', stadium: 'BayArena', bracketId: 6 },
        { date: '2026-02-25T20:00:00Z', home: 'Aston Villa', away: 'Barcelona', stadium: 'Villa Park', bracketId: 7 },
        { date: '2026-02-25T20:00:00Z', home: 'Borussia Dortmund', away: 'PSG', stadium: 'Signal Iduna Park', bracketId: 8 },
        // VUELTA
        { date: '2026-03-10T20:00:00Z', home: 'Arsenal', away: 'PSV', stadium: 'Emirates Stadium', bracketId: 1 },
        { date: '2026-03-10T20:00:00Z', home: 'Real Madrid', away: 'Benfica', stadium: 'Santiago Bernabéu', bracketId: 2 },
        { date: '2026-03-11T20:00:00Z', home: 'Manchester City', away: 'Juventus', stadium: 'Etihad Stadium', bracketId: 3 },
        { date: '2026-03-11T20:00:00Z', home: 'Liverpool', away: 'AC Milan', stadium: 'Anfield', bracketId: 4 },
        { date: '2026-03-17T20:00:00Z', home: 'Bayern Munich', away: 'Atletico Madrid', stadium: 'Allianz Arena', bracketId: 5 },
        { date: '2026-03-17T20:00:00Z', home: 'Inter Milan', away: 'Bayer Leverkusen', stadium: 'San Siro', bracketId: 6 },
        { date: '2026-03-18T20:00:00Z', home: 'Barcelona', away: 'Aston Villa', stadium: 'Camp Nou', bracketId: 7 },
        { date: '2026-03-18T20:00:00Z', home: 'PSG', away: 'Borussia Dortmund', stadium: 'Parc des Princes', bracketId: 8 },
      ];

      let insertedCount = 0;
      for (const m of MATCHES_R16) {
        const match = this.matchRepository.create({
          tournamentId: 'UCL2526', homeTeam: m.home, awayTeam: m.away, homeFlag: getLogo(m.home), awayFlag: getLogo(m.away), 
          date: new Date(m.date), phase: 'ROUND_16', bracketId: m.bracketId, stadium: m.stadium, status: 'SCHEDULED', isManuallyLocked: false
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      for(let i=1; i<=8; i++) {
        const match = this.matchRepository.create({
          tournamentId: 'UCL2526', homeTeam: '', awayTeam: '', homeTeamPlaceholder: 'Ganador Octavos', awayTeamPlaceholder: 'Ganador Octavos',
          date: new Date('2026-04-07T20:00:00Z'), phase: 'QUARTER_FINAL', bracketId: Math.ceil(i/2), stadium: 'TBD', status: 'PENDING', isManuallyLocked: false
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      for(let i=1; i<=4; i++) {
        const match = this.matchRepository.create({
          tournamentId: 'UCL2526', homeTeam: '', awayTeam: '', homeTeamPlaceholder: 'Ganador Cuartos', awayTeamPlaceholder: 'Ganador Cuartos',
          date: new Date('2026-04-28T20:00:00Z'), phase: 'SEMI_FINAL', bracketId: Math.ceil(i/2), stadium: 'TBD', status: 'PENDING', isManuallyLocked: false
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      const finalMatch = this.matchRepository.create({
        tournamentId: 'UCL2526', homeTeam: '', awayTeam: '', homeTeamPlaceholder: 'Finalista 1', awayTeamPlaceholder: 'Finalista 2',
        date: new Date('2026-05-31T20:00:00Z'), phase: 'FINAL', bracketId: 1, stadium: 'Puskás Aréna', status: 'PENDING', isManuallyLocked: false
      });
      await this.matchRepository.save(finalMatch);
      insertedCount++;

      return { success: true, message: `Reseeded ${insertedCount} knockout matches for UCL2526.` };
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

  // --- START TEMPORARY DEBUG ---
  async debugTables() {
    try {
      const result = await this.dataSource.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
      return { success: true, count: result.length, tables: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async debugColumns() {
    try {
      const result = await this.dataSource.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'knockout_phase_status'
        ORDER BY column_name;
      `);
      return { success: true, columns: result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  // --- END TEMPORARY DEBUG ---
}

