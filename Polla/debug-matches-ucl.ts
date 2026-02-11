
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: ['apps/api/src/database/entities/*.entity.ts'],
});

async function checkMatches() {
  try {
    await dataSource.initialize();
    console.log('🔌 Connected to DB');

    // Fetch matches for UCL2526
    const matches = await dataSource.manager.query(`
      SELECT id, "homeTeam", "awayTeam", date, status, "isManuallyLocked", "tournamentId"
      FROM matches 
      WHERE "tournamentId" = 'UCL2526'
      ORDER BY date ASC
    `);

    console.log(`\nFound ${matches.length} matches for UCL2526:`);
    matches.forEach(m => {
        console.log(`[${m.id}] ${m.homeTeam} vs ${m.awayTeam} | Date: ${m.date} | Status: ${m.status} | Locked: ${m.isManuallyLocked}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkMatches();
