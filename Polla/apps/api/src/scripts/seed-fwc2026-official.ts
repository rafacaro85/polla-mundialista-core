import { AppDataSource } from '../data-source';
import { Match } from '../database/entities/match.entity';
import { KnockoutPhaseStatus } from '../database/entities/knockout-phase-status.entity';
import { Logger } from '@nestjs/common';

async function seed() {
  const logger = new Logger('SeedMundial2026Official');
  
  try {
      logger.log('🌱 Connecting to Database...');
      await AppDataSource.initialize();
      logger.log('✅ Database Connected');

      const matchRepo = AppDataSource.getRepository(Match);
      const phaseRepo = AppDataSource.getRepository(KnockoutPhaseStatus);

      const TID = 'FWC2026';

      logger.log(`🗑️ Cleaning up existing data for ${TID}...`);
      // Delete existing matches
      await matchRepo.delete({ tournamentId: TID });
      
      // Delete existing phases
      await phaseRepo.delete({ tournamentId: TID });

      logger.log('🌱 Starting World Cup 2026 Seeder (Official)...');

      // Groups & Teams (Official + Placeholders) - Data needed for group assignment
      const groupsData = {
        'A': ['Mexico', 'South Africa', 'PLA_A', 'South Korea'], // PLA_A was "Dinamarca/..."
        'B': ['Canada', 'PLA_B', 'Switzerland', 'Qatar'], // PLA_B is "Italia/..."
        'C': ['Brazil', 'Morocco', 'Haiti', 'Scotland'],
        'D': ['USA', 'Australia', 'PLA_D', 'Paraguay'], // PLA_D is "Turquia/..."
        'E': ['Germany', 'Curacao', 'Ivory Coast', 'Ecuador'],
        'F': ['Netherlands', 'Japan', 'PLA_F', 'Tunisia'], // PLA_F is "Ucrania/..."
        'G': ['Belgium', 'Egypt', 'Iran', 'New Zealand'],
        'H': ['Spain', 'Cape Verde', 'Saudi Arabia', 'Uruguay'],
        'I': ['France', 'Senegal', 'PLA_I', 'Norway'], // PLA_I is "Irak/..."
        'J': ['Argentina', 'Algeria', 'Austria', 'Jordan'],
        'K': ['Portugal', 'PLA_K', 'Uzbekistan', 'Colombia'], // PLA_K is "Jamaica/..."
        'L': ['England', 'Croatia', 'Ghana', 'Panama'] 
      };

      // Helper to find group
      const findGroup = (teamName: string) => {
          for (const [g, teams] of Object.entries(groupsData)) {
              if (teams.includes(teamName)) return g;
          }
          return 'A'; // Default or handle error
      };

      // 3. Generate Matches (Group Stage - Official Schedule)
      // We parse the PDF text provided by user images/text logic
      
      const SCHEDULE = [
        // JUEVES 11 JUNIO
        { d: '2026-06-11T15:00:00-04:00', h: 'Mexico', a: 'South Africa', s: 'Estadio Ciudad de México' },
        { d: '2026-06-11T22:00:00-04:00', h: 'South Korea', a: 'PLA_A', s: 'Estadio Guadalajara' },
        
        // VIERNES 12 JUNIO
        { d: '2026-06-12T15:00:00-04:00', h: 'Canada', a: 'PLA_B', s: 'Toronto Stadium' },
        { d: '2026-06-12T21:00:00-04:00', h: 'USA', a: 'Paraguay', s: 'Los Angeles Stadium' },

        // SABADO 13 JUNIO
        { d: '2026-06-13T15:00:00-04:00', h: 'Qatar', a: 'Switzerland', s: 'SF Bay Area Stadium' }, // In PDF: Catar vs Suiza (Assuming Match B order)
        { d: '2026-06-13T18:00:00-04:00', h: 'Brazil', a: 'Morocco', s: 'NY NJ Stadium' },
        { d: '2026-06-13T21:00:00-04:00', h: 'Haiti', a: 'Scotland', s: 'Boston Stadium' },
        { d: '2026-06-13T23:59:00-04:00', h: 'Australia', a: 'PLA_D', s: 'BC Place Vancouver' }, // Midnight ET = next day logically but listed under Sat in PDF logic sometimes? PDF says 00:00.

        // DOMINGO 14 JUNIO
        { d: '2026-06-14T13:00:00-04:00', h: 'Germany', a: 'Curacao', s: 'Houston Stadium' },
        { d: '2026-06-14T16:00:00-04:00', h: 'Netherlands', a: 'Japan', s: 'Dallas Stadium' },
        { d: '2026-06-14T19:00:00-04:00', h: 'Ivory Coast', a: 'Ecuador', s: 'Philadelphia Stadium' },
        { d: '2026-06-14T22:00:00-04:00', h: 'PLA_F', a: 'Tunisia', s: 'Estadio Monterrey' },

        // LUNES 15 JUNIO
        { d: '2026-06-15T12:00:00-04:00', h: 'Spain', a: 'Cape Verde', s: 'Atlanta Stadium' },
        { d: '2026-06-15T15:00:00-04:00', h: 'Belgium', a: 'Egypt', s: 'Seattle Stadium' },
        { d: '2026-06-15T18:00:00-04:00', h: 'Saudi Arabia', a: 'Uruguay', s: 'Miami Stadium' },
        { d: '2026-06-15T21:00:00-04:00', h: 'Iran', a: 'New Zealand', s: 'Los Angeles Stadium' },

        // MARTES 16 JUNIO
        { d: '2026-06-16T15:00:00-04:00', h: 'France', a: 'Senegal', s: 'NY NJ Stadium' },
        { d: '2026-06-16T18:00:00-04:00', h: 'PLA_I', a: 'Norway', s: 'Boston Stadium' }, // In PDF: Irak/Bolivia... vs Noruega
        { d: '2026-06-16T21:00:00-04:00', h: 'Argentina', a: 'Algeria', s: 'Kansas City Stadium' },
        { d: '2026-06-17T00:00:00-04:00', h: 'Austria', a: 'Jordan', s: 'SF Bay Area Stadium' },

        // MIERCOLES 17 JUNIO
        { d: '2026-06-17T13:00:00-04:00', h: 'Portugal', a: 'PLA_K', s: 'Houston Stadium' },
        { d: '2026-06-17T16:00:00-04:00', h: 'England', a: 'Croatia', s: 'Dallas Stadium' },
        { d: '2026-06-17T19:00:00-04:00', h: 'Ghana', a: 'Panama', s: 'Toronto Stadium' },
        { d: '2026-06-17T22:00:00-04:00', h: 'Uzbekistan', a: 'Colombia', s: 'Estadio Ciudad de México' },

        // JUEVES 18 JUNIO
        { d: '2026-06-18T12:00:00-04:00', h: 'PLA_A', a: 'South Africa', s: 'Atlanta Stadium' },
        { d: '2026-06-18T15:00:00-04:00', h: 'Switzerland', a: 'PLA_B', s: 'Los Angeles Stadium' },
        { d: '2026-06-18T18:00:00-04:00', h: 'Canada', a: 'Qatar', s: 'BC Place Vancouver' },
        { d: '2026-06-18T21:00:00-04:00', h: 'Mexico', a: 'South Korea', s: 'Estadio Guadalajara' },

        // VIERNES 19 JUNIO
        { d: '2026-06-19T15:00:00-04:00', h: 'USA', a: 'Australia', s: 'Seattle Stadium' },
        { d: '2026-06-19T18:00:00-04:00', h: 'Scotland', a: 'Morocco', s: 'Boston Stadium' },
        { d: '2026-06-19T21:00:00-04:00', h: 'Brazil', a: 'Haiti', s: 'Philadelphia Stadium' },
        { d: '2026-06-20T00:00:00-04:00', h: 'PLA_D', a: 'Paraguay', s: 'SF Bay Area Stadium' }, // In PDF: Turquia... vs Paraguay

        // SABADO 20 JUNIO
        { d: '2026-06-20T13:00:00-04:00', h: 'Netherlands', a: 'PLA_F', s: 'Houston Stadium' }, // Paises Bajos vs Ucrania...
        { d: '2026-06-20T16:00:00-04:00', h: 'Germany', a: 'Ivory Coast', s: 'Toronto Stadium' },
        { d: '2026-06-20T22:00:00-04:00', h: 'Ecuador', a: 'Curacao', s: 'Kansas City Stadium' },
        { d: '2026-06-21T00:00:00-04:00', h: 'Tunisia', a: 'Japan', s: 'Estadio Monterrey' }, // Tunez vs Japon

        // DOMINGO 21 JUNIO
        { d: '2026-06-21T12:00:00-04:00', h: 'Spain', a: 'Saudi Arabia', s: 'Atlanta Stadium' },
        { d: '2026-06-21T15:00:00-04:00', h: 'Belgium', a: 'Iran', s: 'Los Angeles Stadium' },
        { d: '2026-06-21T18:00:00-04:00', h: 'Uruguay', a: 'Cape Verde', s: 'Miami Stadium' },
        { d: '2026-06-21T21:00:00-04:00', h: 'New Zealand', a: 'Egypt', s: 'BC Place Vancouver' },

        // LUNES 22 JUNIO 
        { d: '2026-06-22T13:00:00-04:00', h: 'Argentina', a: 'Austria', s: 'Dallas Stadium' },
        { d: '2026-06-22T17:00:00-04:00', h: 'France', a: 'PLA_I', s: 'Philadelphia Stadium' },
        { d: '2026-06-22T20:00:00-04:00', h: 'Norway', a: 'Senegal', s: 'NY NJ Stadium' },
        { d: '2026-06-22T23:00:00-04:00', h: 'Jordan', a: 'Algeria', s: 'SF Bay Area Stadium' },

        // MARTES 23 JUNIO
        { d: '2026-06-23T13:00:00-04:00', h: 'Portugal', a: 'Uzbekistan', s: 'Houston Stadium' },
        { d: '2026-06-23T16:00:00-04:00', h: 'England', a: 'Ghana', s: 'Boston Stadium' },
        { d: '2026-06-23T19:00:00-04:00', h: 'Panama', a: 'Croatia', s: 'Toronto Stadium' },
        { d: '2026-06-23T22:00:00-04:00', h: 'Colombia', a: 'PLA_K', s: 'Estadio Guadalajara' }, // Colombia vs Jamaica...

        // MIERCOLES 24 JUNIO
        { d: '2026-06-24T15:00:00-04:00', h: 'Switzerland', a: 'Canada', s: 'BC Place Vancouver' },
        { d: '2026-06-24T15:00:00-04:00', h: 'PLA_B', a: 'Qatar', s: 'Seattle Stadium' }, // Italia... vs Catar
        { d: '2026-06-24T18:00:00-04:00', h: 'Brazil', a: 'Scotland', s: 'Miami Stadium' },
        { d: '2026-06-24T18:00:00-04:00', h: 'Morocco', a: 'Haiti', s: 'Atlanta Stadium' },
        { d: '2026-06-24T21:00:00-04:00', h: 'PLA_A', a: 'Mexico', s: 'Estadio Ciudad de México' },
        { d: '2026-06-24T21:00:00-04:00', h: 'South Africa', a: 'South Korea', s: 'Estadio Monterrey' },

        // JUEVES 25 JUNIO
        { d: '2026-06-25T16:00:00-04:00', h: 'Curacao', a: 'Ivory Coast', s: 'Philadelphia Stadium' },
        { d: '2026-06-25T16:00:00-04:00', h: 'Ecuador', a: 'Germany', s: 'NY NJ Stadium' },
        { d: '2026-06-25T19:00:00-04:00', h: 'Japan', a: 'PLA_F', s: 'Dallas Stadium' },
        { d: '2026-06-25T19:00:00-04:00', h: 'Tunisia', a: 'Netherlands', s: 'Kansas City Stadium' },
        { d: '2026-06-25T22:00:00-04:00', h: 'PLA_D', a: 'USA', s: 'Los Angeles Stadium' }, // Turquia... vs USA
        { d: '2026-06-25T22:00:00-04:00', h: 'Paraguay', a: 'Australia', s: 'SF Bay Area Stadium' },
        
        // VIERNES 26 JUNIO
        { d: '2026-06-26T15:00:00-04:00', h: 'Norway', a: 'France', s: 'Boston Stadium' },
        { d: '2026-06-26T15:00:00-04:00', h: 'Senegal', a: 'PLA_I', s: 'Toronto Stadium' },
        { d: '2026-06-26T20:00:00-04:00', h: 'Cape Verde', a: 'Saudi Arabia', s: 'Houston Stadium' },
        { d: '2026-06-26T20:00:00-04:00', h: 'Uruguay', a: 'Spain', s: 'Estadio Guadalajara' },
        { d: '2026-06-26T23:00:00-04:00', h: 'Egypt', a: 'Iran', s: 'Seattle Stadium' },
        { d: '2026-06-26T23:00:00-04:00', h: 'New Zealand', a: 'Belgium', s: 'BC Place Vancouver' },

        // SABADO 27 JUNIO
        { d: '2026-06-27T17:00:00-04:00', h: 'Panama', a: 'England', s: 'NY NJ Stadium' },
        { d: '2026-06-27T17:00:00-04:00', h: 'Croatia', a: 'Ghana', s: 'Philadelphia Stadium' },
        { d: '2026-06-27T19:30:00-04:00', h: 'Colombia', a: 'Portugal', s: 'Miami Stadium' },
        { d: '2026-06-27T19:30:00-04:00', h: 'PLA_K', a: 'Uzbekistan', s: 'Atlanta Stadium' },
        { d: '2026-06-27T22:00:00-04:00', h: 'Algeria', a: 'Austria', s: 'Kansas City Stadium' },
        { d: '2026-06-27T22:00:00-04:00', h: 'Jordan', a: 'Argentina', s: 'Dallas Stadium' },
      ];

      logger.log(`⚽ Generating ${SCHEDULE.length} Official Matches...`);
      
      let created = 0;
      for (const m of SCHEDULE) {
        // Convert ET to UTC by instantiating Date which handles parsing
        // Note: '2026-06-11T15:00:00-04:00' is ISO8601 with offset, standard engines parse this correctly.
        const matchDate = new Date(m.d);
        
        let homeFlag = `https://flagsapi.com/${getCountryCode(m.h)}/flat/64.png`;
        if (m.h.startsWith('PLA_')) {
            homeFlag = '/images/flags/placeholder.png'; // Or some default
        }

        let awayFlag = `https://flagsapi.com/${getCountryCode(m.a)}/flat/64.png`;
        if (m.a.startsWith('PLA_')) {
            awayFlag = '/images/flags/placeholder.png'; // Or some default
        }

        const match = matchRepo.create({
            tournamentId: TID,
            homeTeam: m.h,
            awayTeam: m.a,
            homeFlag: homeFlag,
            awayFlag: awayFlag,
            date: matchDate,
            phase: 'GROUP_STAGE', // Or GROUP
            group: findGroup(m.h), 
            status: 'SCHEDULED',
            stadium: m.s
        } as any);
        await matchRepo.save(match);
        created++;
      }
      logger.log(`✅ Created ${created} matches.`);

      // 4. Seed Phases (To unlock Progress Bar)
      logger.log('🔓 Seeding Phase Statuses...');
      
      const PHASES = [
        'GROUP', 'ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'
      ];

      for (const p of PHASES) {
        const isUnlocked = p === 'GROUP';
        const phase = phaseRepo.create({
            phase: p,
            tournamentId: TID,
            isUnlocked: isUnlocked,
            unlockedAt: isUnlocked ? new Date() : (null as any),
            allMatchesCompleted: false
        } as any);
        await phaseRepo.save(phase);
      }
      logger.log('✅ Phase Statuses created.');

      logger.log('🏁 Seeding Complete Successfully.');
  } catch (error) {
      logger.error('❌ Seeding failed:', error);
      throw error;
  } finally {
      if (AppDataSource.isInitialized) {
          await AppDataSource.destroy();
      }
  }
}

function getCountryCode(name: string): string {
    const codes: {[key: string]: string} = {
      'Mexico': 'MX', 'South Africa': 'ZA', 'South Korea': 'KR',
      'Canada': 'CA', 'Switzerland': 'CH', 'Qatar': 'QA',
      'Brazil': 'BR', 'Morocco': 'MA', 'Haiti': 'HT', 'Scotland': 'GB', // Scotland often mapped to GB or custom
      'USA': 'US', 'Australia': 'AU', 'Paraguay': 'PY',
      'Germany': 'DE', 'Curacao': 'CW', 'Ivory Coast': 'CI', 'Ecuador': 'EC',
      'Netherlands': 'NL', 'Japan': 'JP', 'Tunisia': 'TN',
      'Belgium': 'BE', 'Egypt': 'EG', 'Iran': 'IR', 'New Zealand': 'NZ',
      'Spain': 'ES', 'Cape Verde': 'CV', 'Saudi Arabia': 'SA', 'Uruguay': 'UY',
      'France': 'FR', 'Senegal': 'SN', 'Norway': 'NO',
      'Argentina': 'AR', 'Algeria': 'DZ', 'Austria': 'AT', 'Jordan': 'JO',
      'Portugal': 'PT', 'Uzbekistan': 'UZ', 'Colombia': 'CO',
      'England': 'GB', 'Croatia': 'HR', 'Ghana': 'GH', 'Panama': 'PA',
      // Placeholders
      'PLA_A': 'UN', 'PLA_B': 'UN', 'PLA_D': 'UN', 'PLA_F': 'UN', 'PLA_I': 'UN', 'PLA_K': 'UN' 
    };
    return codes[name] || 'UN';
  }

seed().catch(err => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
