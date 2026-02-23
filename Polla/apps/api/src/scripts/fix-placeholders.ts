import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { config } from 'dotenv';
import * as path from 'path';

// Try multiple paths for .env
const envPath = path.resolve(__dirname, '../../../../.env');
console.log(`Looking for .env at: ${envPath}`);
config({ path: envPath });

async function main() {
  console.log('--- FIX PLACEHOLDERS AND AI CACHE ---');

  if (!process.env.DATABASE_URL) {
    console.error(
      'DATABASE_URL not found in env. Checking hardcoded fallback or exit.',
    );
    // If we are desperate, we could peek at logs but here we exit.
    // process.env.DATABASE_URL = '...';
  }

  if (!process.env.DATABASE_URL) {
    console.error('CRITICAL: NO DATABASE_URL');
    process.exit(1);
  }

  const dataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [Match],
    synchronize: false,
    ssl: { rejectUnauthorized: false },
  });

  await dataSource.initialize();
  const repo = dataSource.getRepository(Match);

  // Find matches in knockout phases
  const matches = await repo.find({
    where: { tournamentId: 'WC2026' },
  });

  let fixedCount = 0;

  for (const m of matches) {
    let changed = false;

    // Only clean placeholders in Knockout Rounds (Not Group)
    if (m.phase !== 'GROUP') {
      // Check Home
      if (
        m.homeTeam &&
        (m.homeTeam.startsWith('PLA_') || m.homeTeam.includes('_'))
      ) {
        console.log(
          `Cleaning Home Team ${m.homeTeam} in Match ${m.id} (${m.phase})`,
        );
        m.homeTeam = '';
        m.homeFlag = '';
        changed = true;
      }

      // Check Away
      if (
        m.awayTeam &&
        (m.awayTeam.startsWith('PLA_') || m.awayTeam.includes('_'))
      ) {
        console.log(
          `Cleaning Away Team ${m.awayTeam} in Match ${m.id} (${m.phase})`,
        );
        m.awayTeam = '';
        m.awayFlag = '';
        changed = true;
      }

      // Clear AI Cache for Knockout matches (to apply new filters)
      if (m.aiPredictionScore || m.aiPrediction) {
        m.aiPrediction = null;
        m.aiPredictionScore = null;
        m.aiPredictionGeneratedAt = null;
        changed = true;
        // console.log(`Cleared AI Cache for Knockout Match ${m.id}`);
      }
    }

    if (changed) {
      await repo.save(m);
      fixedCount++;
    }
  }

  console.log(`Fixed/Cleaned ${fixedCount} matches.`);
  await dataSource.destroy();
}

main().catch(console.error);
