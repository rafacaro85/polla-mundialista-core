import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkFinalPhases() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'polla_mundialista',
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('--- Current SEMI Matches ---');
    const semis = await dataSource.query(`
            SELECT id, date, "homeTeamPlaceholder", "awayTeamPlaceholder", phase 
            FROM matches 
            WHERE phase = 'SEMI' 
            ORDER BY date ASC, id ASC
        `);
    console.log(semis);

    console.log('--- Current FINAL Matches ---');
    const finals = await dataSource.query(`
            SELECT id, date, "homeTeamPlaceholder", "awayTeamPlaceholder", phase 
            FROM matches 
            WHERE phase = 'FINAL' OR phase = 'THIRD_PLACE'
            ORDER BY date ASC, id ASC
        `);
    console.log(finals);
  } catch (e) {
    console.error('Error during check:', e);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

checkFinalPhases();
