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

async function registerTestTournament() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    // Check if tournament already exists
    const existing = await AppDataSource.query(`
      SELECT * FROM tournaments WHERE id = 'TEST_LIVE_MONDAY'
    `);

    if (existing.length > 0) {
      console.log('⚠️  Tournament TEST_LIVE_MONDAY already registered!');
      console.log('   Name:', existing[0].name);
      console.log('   Active:', existing[0].active);
      process.exit(0);
    }

    console.log('🏗️  Registering TEST_LIVE_MONDAY tournament...\n');

    // Insert tournament record
    await AppDataSource.query(`
      INSERT INTO tournaments (id, name, active, "startDate", "endDate")
      VALUES (
        'TEST_LIVE_MONDAY',
        '⚙️ System Config (Admin Only)',
        true,
        NOW(),
        '2026-12-31'
      )
    `);

    console.log('✅ Tournament registered successfully!\n');
    console.log('📋 Tournament Details:');
    console.log('   ID: TEST_LIVE_MONDAY');
    console.log('   Name: ⚙️ System Config (Admin Only)');
    console.log('   Active: true');
    console.log('\n🎯 Now you can access it at:');
    console.log('   https://lapollavirtual.com/hub');
    console.log('\n💡 Select "⚙️ System Config (Admin Only)" from the dropdown');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

registerTestTournament();
