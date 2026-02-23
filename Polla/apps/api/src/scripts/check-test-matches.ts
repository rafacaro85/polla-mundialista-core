import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Match],
  ssl: { rejectUnauthorized: false },
});

async function check() {
  await AppDataSource.initialize();
  const matchRepo = AppDataSource.getRepository(Match);

  console.log('Checking matches for TEST_LIVE_MONDAY...');

  const matches = await matchRepo.find({
    where: { tournamentId: 'TEST_LIVE_MONDAY' },
    order: { date: 'ASC' },
  });

  console.log(`Found ${matches.length} matches.`);

  matches.forEach((m) => {
    console.log(
      `- [${m.id}] ${m.homeTeam} vs ${m.awayTeam} | Status: ${m.status} | Date: ${m.date.toISOString()} | TimerActive: ${m.isTimerActive} | Min: ${m.minute}`,
    );
  });

  await AppDataSource.destroy();
}

check().catch(console.error);
