
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
    path.resolve(process.cwd(), '../apps/api/.env'),
    path.resolve(process.cwd(), '../../apps/api/.env'),
    'C:/AppWeb/Polla/apps/api/.env'
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
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }, 
});

async function checkSchema() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to DB');

    // Get table info
    const columns = await AppDataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'matches'
    `);

    console.log('--- Columns in matches table ---');
    console.log(columns.map((c: any) => c.column_name).sort().join('\n'));

    const kColumns = await AppDataSource.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'knockout_phase_status'
    `);
    console.log('--- Columns in knockout_phase_status table ---');
    console.log(kColumns.map((c: any) => c.column_name).sort().join('\n'));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

checkSchema();
