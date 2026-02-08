import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkRound16() {
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
    console.log('--- Current ROUND_16 Matches ---');

    // Use raw query to avoid Entity metadata issues if paths are wonky
    const matches = await dataSource.query(`
            SELECT id, date, "homeTeam", "awayTeam", "homeTeamPlaceholder", "awayTeamPlaceholder" 
            FROM matches 
            WHERE phase = 'ROUND_16' 
            ORDER BY date ASC, id ASC
        `);

    matches.forEach((m: any) => {
      console.log(
        `ID: ${m.id}, Date: ${m.date}, Home: ${m.homeTeamPlaceholder || m.homeTeam}, Away: ${m.awayTeamPlaceholder || m.awayTeam}`,
      );
    });
  } catch (e) {
    console.error('Error during check:', e);
  } finally {
    if (dataSource.isInitialized) await dataSource.destroy();
  }
}

checkRound16();
