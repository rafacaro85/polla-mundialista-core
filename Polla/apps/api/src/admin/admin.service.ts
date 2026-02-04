import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Match)
    private matchRepository: Repository<Match>,
    private dataSource: DataSource,
  ) {}

  async seedUCLMatches() {
    try {
      // Check if tables exist, if not, sync schema
      let count = 0;
      try {
        count = await this.matchRepository.count();
      } catch (error: any) {
        if (error.code === '42P01') {
          // Tables don't exist, sync schema
          await this.dataSource.synchronize();
          console.log('✅ Schema synchronized');
          count = 0;
        } else {
          throw error;
        }
      }

      if (count > 0) {
        return {
          success: false,
          message: `Database not empty (${count} matches). Clear first if needed.`,
        };
      }

      const TEAMS: Record<string, string> = {
        'Manchester City': 'gb-eng',
        'Real Madrid': 'es',
        'Bayern Munich': 'de',
        'Liverpool': 'gb-eng',
        'Inter Milan': 'it',
        'Arsenal': 'gb-eng',
        'Barcelona': 'es',
        'PSG': 'fr',
        'Atletico Madrid': 'es',
        'Borussia Dortmund': 'de',
        'Bayer Leverkusen': 'de',
        'Juventus': 'it',
        'AC Milan': 'it',
        'Benfica': 'pt',
        'Aston Villa': 'gb-eng',
        'PSV': 'nl'
      };

      const getLogo = (team: string): string => {
        const code = TEAMS[team];
        return code ? `https://flagcdn.com/w40/${code}.png` : '';
      };

      const MATCHES = [
        // PLAY-OFFS IDA (Feb 17-18, 2026)
        { date: '2026-02-17T20:00:00Z', home: 'Benfica', away: 'Real Madrid', group: 'PO', stadium: 'Estádio da Luz' },
        { date: '2026-02-17T20:00:00Z', home: 'AC Milan', away: 'Liverpool', group: 'PO', stadium: 'San Siro' },
        { date: '2026-02-17T20:00:00Z', home: 'PSV', away: 'Arsenal', group: 'PO', stadium: 'Philips Stadion' },
        { date: '2026-02-17T20:00:00Z', home: 'Club Brugge', away: 'Atletico Madrid', group: 'PO', stadium: 'Jan Breydel Stadium' },
        
        { date: '2026-02-18T20:00:00Z', home: 'Juventus', away: 'Manchester City', group: 'PO', stadium: 'Allianz Stadium' },
        { date: '2026-02-18T20:00:00Z', home: 'Bayer Leverkusen', away: 'Inter Milan', group: 'PO', stadium: 'BayArena' },
        { date: '2026-02-18T20:00:00Z', home: 'Sporting CP', away: 'Bayern Munich', group: 'PO', stadium: 'Estádio José Alvalade' },
        { date: '2026-02-18T20:00:00Z', home: 'Feyenoord', away: 'PSG', group: 'PO', stadium: 'De Kuip' },

        // PLAY-OFFS VUELTA (Feb 24-25, 2026)
        { date: '2026-02-24T20:00:00Z', home: 'Real Madrid', away: 'Benfica', group: 'PO', stadium: 'Santiago Bernabéu' },
        { date: '2026-02-24T20:00:00Z', home: 'Liverpool', away: 'AC Milan', group: 'PO', stadium: 'Anfield' },
        { date: '2026-02-24T20:00:00Z', home: 'Arsenal', away: 'PSV', group: 'PO', stadium: 'Emirates Stadium' },
        { date: '2026-02-24T20:00:00Z', home: 'Atletico Madrid', away: 'Club Brugge', group: 'PO', stadium: 'Metropolitano' },

        { date: '2026-02-25T20:00:00Z', home: 'Manchester City', away: 'Juventus', group: 'PO', stadium: 'Etihad Stadium' },
        { date: '2026-02-25T20:00:00Z', home: 'Inter Milan', away: 'Bayer Leverkusen', group: 'PO', stadium: 'San Siro' },
        { date: '2026-02-25T20:00:00Z', home: 'Bayern Munich', away: 'Sporting CP', group: 'PO', stadium: 'Allianz Arena' },
        { date: '2026-02-25T20:00:00Z', home: 'PSG', away: 'Feyenoord', group: 'PO', stadium: 'Parc des Princes' }
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
          phase: 'PLAYOFFS', // Updated phase
          stadium: matchData.stadium,
          homeScore: null,
          awayScore: null,
          status: 'SCHEDULED',
          isManuallyLocked: false,
        });
        await this.matchRepository.save(match);
        insertedCount++;
      }

      return {
        success: true,
        message: `UCL Beta seeded successfully: ${insertedCount} matches`,
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
}
