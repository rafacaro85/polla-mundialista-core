import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
    });

async function forceUpdateTestMatch() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    // Force update with exact time to break cache
    await AppDataSource.query(`
      UPDATE matches 
      SET 
        date = '2026-02-15T23:30:00.000Z',
        "group" = 'PARTIDO DE PRUEBA',
        "homeTeam" = 'Deportivo Cali',
        "awayTeam" = 'Atlético Nacional'
      WHERE "externalId" = 1505992
    `);

    console.log('✅ Test match forcefully updated!');
    console.log('   Date: 2026-02-15T23:30:00Z (18:30 Colombia time)');
    console.log('   Group: PARTIDO DE PRUEBA');
    console.log('\n🔄 Cache should be invalidated now. Refresh the page.');

    // Verify
    const result = await AppDataSource.query(`
      SELECT date, "group" 
      FROM matches 
      WHERE "externalId" = 1505992
    `);

    console.log('\n📊 Verification:');
    console.log(`   DB Date: ${result[0].date}`);
    console.log(`   DB Group: ${result[0].group}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

forceUpdateTestMatch();
