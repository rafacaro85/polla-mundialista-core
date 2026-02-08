import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkPlaceholders() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'polla_mundialista',
    entities: ['src/database/entities/*.entity.ts'],
    ssl: false,
  });

  try {
    await dataSource.initialize();
    const placeholders = await dataSource.query(`
            SELECT DISTINCT "homeTeamPlaceholder" 
            FROM matches 
            WHERE phase = 'ROUND_32' AND "homeTeamPlaceholder" IS NOT NULL
            UNION
            SELECT DISTINCT "awayTeamPlaceholder" 
            FROM matches 
            WHERE phase = 'ROUND_32' AND "awayTeamPlaceholder" IS NOT NULL
        `);
    console.log('Placeholders pendientes:', placeholders);
  } catch (e) {
    console.error(e);
  } finally {
    await dataSource.destroy();
  }
}
checkPlaceholders();
