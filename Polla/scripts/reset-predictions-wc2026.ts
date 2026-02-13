
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

async function resetPredictions() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Connected to DB');

        // 1. Delete ALL predictions linked to WC2026 matches
        console.log('🗑️  Deleting valid predictions linked to WC2026 matches...');
        const deleteValid = await AppDataSource.query(`
            DELETE FROM predictions 
            WHERE "matchId" IN (
                SELECT id FROM matches WHERE "tournamentId" = 'WC2026'
            )
        `);
        console.log(`   -> Deleted rows (approximated): ${deleteValid[1] || 'Unknown'}`);

        // 2. Delete Brackets for WC2026
        console.log('🗑️  Deleting ALL user brackets for WC2026...');
        await AppDataSource.query(`
            DELETE FROM user_brackets 
            WHERE "tournamentId" = 'WC2026'
        `);
        
        // 3. Delete Orphans (safety sweep)
        console.log('🗑️  Deleting orphaned individual predictions...');
        await AppDataSource.query(`
            DELETE FROM predictions 
            WHERE "matchId" NOT IN (SELECT id FROM matches)
        `);

        console.log('✅ WC2026 Predictions FULLY reset. Matches remain untouched.');

    } catch (error) {
        console.error('Error during reset:', error);
    } finally {
        await AppDataSource.destroy();
    }
}

resetPredictions();
