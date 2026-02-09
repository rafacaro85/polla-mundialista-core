
import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { config } from 'dotenv';
config();

async function main() {
  console.log('--- SURVEY KNOCKOUT PHASE ---');
  
  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Match],
    synchronize: false,
    ssl: { rejectUnauthorized: false },
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(Match);

  const matches = await repo.find({
    where: { phase: 'ROUND_32', tournamentId: 'WC2026' },
    order: { bracketId: 'ASC' },
  });

  console.log(`Found ${matches.length} R32 matches.`);

  let dirtyCount = 0;
  let emptyCount = 0;

  matches.forEach(m => {
      const isDirtyHome = m.homeTeam && (m.homeTeam.startsWith('PLA_') || m.homeTeam.includes('_'));
      const isDirtyAway = m.awayTeam && (m.awayTeam.startsWith('PLA_') || m.awayTeam.includes('_'));
      
      if (isDirtyHome || isDirtyAway) {
          console.log(`DIRTY MATCH ${m.bracketId}: ${m.homeTeam} vs ${m.awayTeam} (Placeholder: ${m.homeTeamPlaceholder} vs ${m.awayTeamPlaceholder})`);
          dirtyCount++;
      }

      if (!m.homeTeam || !m.awayTeam) {
          // console.log(`EMPTY MATCH ${m.bracketId}: ${m.homeTeam || '???'} vs ${m.awayTeam || '???'}`);
          emptyCount++;
      }
  });

  console.log(`Total Dirty Matches: ${dirtyCount}`);
  console.log(`Total Empty Matches: ${emptyCount}`);

  await dataSource.destroy();
}

main().catch(console.error);
