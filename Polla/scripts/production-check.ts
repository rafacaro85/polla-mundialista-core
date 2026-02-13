import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Force load env
let envFile = path.resolve(process.cwd(), '.env');
const attempts = [
    path.resolve(process.cwd(), '.env.production.temp'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
];

// Find the first existing .env file
for (const attempt of attempts) {
    if (fs.existsSync(attempt)) {
        envFile = attempt;
        break;
    }
}

dotenv.config({ path: envFile });

// Production Credentials (HARDCODED FOR THIS ONCE-OFF SCRIPT)
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'polla_mundialista',
  synchronize: false,
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }, 
});

async function checkConsistency() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to PRODUCTION DB');
    
    // 1. Count ALL predictions for WC2026 (via match link)
    const predictionsCount = await AppDataSource.query(`
        SELECT COUNT(p.id) as count 
        FROM predictions p 
        JOIN matches m ON p."matchId" = m.id 
        WHERE m."tournamentId" = 'WC2026'
    `);
    console.log(`📊 Valid WC2026 Predictions: ${predictionsCount[0].count}`);

    // 2. Count orphans
    const orphans = await AppDataSource.query(`
        SELECT COUNT(p.id) as count 
        FROM predictions p 
        LEFT JOIN matches m ON p."matchId" = m.id 
        WHERE m.id IS NULL
    `);
    console.log(`🚨 ORPHANED Predictions: ${orphans[0].count}`);

    // 3. Count User Brackets for WC2026
    const bracketCount = await AppDataSource.query(`
        SELECT COUNT(id) as count 
        FROM user_brackets 
        WHERE "tournamentId" = 'WC2026'
    `);
    console.log(`🏆 WC2026 User Brackets: ${bracketCount[0].count}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkConsistency();
