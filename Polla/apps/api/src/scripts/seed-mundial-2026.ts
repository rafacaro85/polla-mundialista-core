import { AppDataSource } from '../data-source';
import { Tournament } from '../tournaments/entities/tournament.entity';
import { Team } from '../teams/entities/team.entity';
import { Match } from '../matches/entities/match.entity';
import { Logger } from '@nestjs/common';

async function seed() {
  const logger = new Logger('SeedMundial2026');
  
  try {
      logger.log('🌱 Connecting to Database...');
      await AppDataSource.initialize();
      logger.log('✅ Database Connected');

      const tournamentRepo = AppDataSource.getRepository(Tournament);
      const teamRepo = AppDataSource.getRepository(Team);
      const matchRepo = AppDataSource.getRepository(Match);

      logger.log('🌱 Starting World Cup 2026 Seeder...');

      // 1. Create Tournament
      let tournament = await tournamentRepo.findOne({ where: { id: 'FWC2026' } });
      if (!tournament) {
        tournament = tournamentRepo.create({
          id: 'FWC2026',
          name: 'FIFA World Cup 2026',
          startDate: new Date('2026-06-11'),
          endDate: new Date('2026-07-19'),
          status: 'UPCOMING', 
          type: 'WORLD_CUP', 
        });
        await tournamentRepo.save(tournament);
        logger.log('🏆 Tournament FWC2026 created.');
      } else {
        logger.log('🏆 Tournament FWC2026 already exists.');
      }

      // 2. Groups & Teams (48 Teams, 12 Groups of 4)
      const groupsData = {
        'A': ['Mexico', 'Ethiopia', 'Russia', 'South Korea'],
        'B': ['Canada', 'France', 'Australia', 'Chile'],
        'C': ['USA', 'England', 'Iran', 'Serbia'],
        'D': ['Brazil', 'Egypt', 'Japan', 'Sweden'],
        'E': ['Spain', 'Ivory Coast', 'Saudi Arabia', 'Uruguay'],
        'F': ['Argentina', 'Nigeria', 'Qatar', 'Switzerland'],
        'G': ['Germany', 'Algeria', 'China', 'Paraguay'],
        'H': ['Belgium', 'Cameroon', 'India', 'Peru'],
        'I': ['Portugal', 'Ghana', 'Iraq', 'Colombia'],
        'J': ['Netherlands', 'Morocco', 'Uzbekistan', 'Ecuador'],
        'K': ['Italy', 'Senegal', 'UAE', 'Croatia'],
        'L': ['Denmark', 'Mali', 'Thailand', 'Poland'] 
      };

      const teamsMap = new Map<string, Team>();

      for (const [group, teams] of Object.entries(groupsData)) {
        for (const teamName of teams) {
          let team = await teamRepo.findOne({ where: { name: teamName } });
          
          if (!team) {
            team = teamRepo.create({
              name: teamName,
              flagUrl: `https://flagsapi.com/${getCountryCode(teamName)}/flat/64.png`, 
              group: group,
              tournament: tournament,
            });
            await teamRepo.save(team);
            logger.log(`🏳️ Team ${teamName} created in Group ${group}`);
          } else {
            team.group = group;
            team.tournament = tournament;
            await teamRepo.save(team);
          }
          teamsMap.set(teamName, team);
        }
      }

      // 3. Generate Matches (Group Stage)
      const matches = await matchRepo.find({ where: { tournament: { id: tournament.id } } });
      if (matches.length > 0) {
        logger.log('⚽ Matches already exist. Skipping match generation.');
      } else {
        logger.log('⚽ Generating Group Stage Matches...');
        let matchCount = 0;
        
        for (const [group, teamNames] of Object.entries(groupsData)) {
          const groupTeams = teamNames.map(name => teamsMap.get(name)!);
          
          const pairings = [
            [0, 1], [2, 3], 
            [0, 2], [1, 3], 
            [0, 3], [1, 2]  
          ];

          let baseDate = new Date('2026-06-11T12:00:00Z');
          const groupIndex = Object.keys(groupsData).indexOf(group);
          baseDate.setDate(baseDate.getDate() + groupIndex); 

          for (const [idx1, idx2] of pairings) {
            const home = groupTeams[idx1];
            const away = groupTeams[idx2];
            
            const match = matchRepo.create({
              tournament: tournament,
              homeTeam: home.name, 
              awayTeam: away.name, 
              date: new Date(baseDate.getTime() + matchCount * 1000 * 60 * 60 * 3), 
              stage: 'GROUP_STAGE',
              group: group,
              status: 'SCHEDULED',
            });
            await matchRepo.save(match);
            matchCount++;
          }
        }
        logger.log(`✅ Generated ${matchCount} group stage matches.`);
      }

      logger.log('🏁 Seeding Complete.');
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
    'Mexico': 'MX', 'Ethiopia': 'ET', 'Russia': 'RU', 'South Korea': 'KR',
    'Canada': 'CA', 'France': 'FR', 'Australia': 'AU', 'Chile': 'CL',
    'USA': 'US', 'England': 'GB', 'Iran': 'IR', 'Serbia': 'RS',
    'Brazil': 'BR', 'Egypt': 'EG', 'Japan': 'JP', 'Sweden': 'SE',
    'Spain': 'ES', 'Ivory Coast': 'CI', 'Saudi Arabia': 'SA', 'Uruguay': 'UY',
    'Argentina': 'AR', 'Nigeria': 'NG', 'Qatar': 'QA', 'Switzerland': 'CH',
    'Germany': 'DE', 'Algeria': 'DZ', 'China': 'CN', 'Paraguay': 'PY',
    'Belgium': 'BE', 'Cameroon': 'CM', 'India': 'IN', 'Peru': 'PE',
    'Portugal': 'PT', 'Ghana': 'GH', 'Iraq': 'IQ', 'Colombia': 'CO',
    'Netherlands': 'NL', 'Morocco': 'MA', 'Uzbekistan': 'UZ', 'Ecuador': 'EC',
    'Italy': 'IT', 'Senegal': 'SN', 'UAE': 'AE', 'Croatia': 'HR',
    'Denmark': 'DK', 'Mali': 'ML', 'Thailand': 'TH', 'Poland': 'PL'
  };
  return codes[name] || 'UN';
}

seed().catch(err => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
