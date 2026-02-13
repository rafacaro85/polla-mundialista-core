

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Force load env
let envFile = path.resolve(process.cwd(), '.env');
// Check common locations
const attempts = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
    path.resolve(process.cwd(), '../apps/api/.env'),
    path.resolve(process.cwd(), '../../apps/api/.env'),
    'C:/AppWeb/Polla/apps/api/.env' // Hardcoded fallback
];

for (const p of attempts) {
    if (fs.existsSync(p)) {
        envFile = p;
        break;
    }
}
console.log('Loading .env from:', envFile);
dotenv.config({ path: envFile });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'polla_mundialista',
  synchronize: false,
  ssl: { rejectUnauthorized: false }, // Fix for Railway SSL
});

async function checkMatches() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to DB');

    // RAW SQL QUERY
    const matches = await AppDataSource.query(`
        SELECT id, "homeTeam", "awayTeam", phase, "tournamentId"
        FROM matches 
        WHERE "tournamentId" = 'WC2026'
        ORDER BY date ASC
        LIMIT 5
    `);

    console.log('--- WC2026 Matches Sample ---');
    matches.forEach((m: any) => {
        console.log(`ID: ${m.id} | ${m.homeTeam} vs ${m.awayTeam} | Phase: ${m.phase}`);
    });

    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Check ALL matches for invalid IDs
    const allMatches = await AppDataSource.query(`
        SELECT id FROM matches WHERE "tournamentId" = 'WC2026'
    `);

    const invalidIds = allMatches.filter((m: any) => !regex.test(m.id));
    
    if (invalidIds.length > 0) {
        console.error(`❌ Found ${invalidIds.length} INVALID UUIDs in WC2026 matches!`);
        invalidIds.slice(0, 5).forEach((m: any) => console.log(`INVALID: ${m.id}`));
    } else {
        console.log(`✅ All ${allMatches.length} WC2026 matches have valid UUIDs`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkMatches();
