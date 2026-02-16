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

async function checkTestMatch() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    const result = await AppDataSource.query(`
      SELECT id, "homeTeam", "awayTeam", date, "group", "externalId"
      FROM matches 
      WHERE "externalId" = 1505992
    `);

    if (result.length === 0) {
      console.log('❌ Test match not found');
      process.exit(1);
    }

    const match = result[0];
    console.log('📊 Test Match Details:');
    console.log(`   ID: ${match.id}`);
    console.log(`   Match: ${match.homeTeam} vs ${match.awayTeam}`);
    console.log(`   Date (DB): ${match.date}`);
    console.log(`   Date (Local): ${new Date(match.date).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
    console.log(`   Group: ${match.group}`);
    console.log(`   External ID: ${match.externalId}`);

    const now = new Date();
    const matchDate = new Date(match.date);
    const hoursUntil = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    console.log(`\n⏰ Time Check:`);
    console.log(`   Current time: ${now.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
    console.log(`   Match time: ${matchDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })}`);
    console.log(`   Hours until kickoff: ${hoursUntil.toFixed(2)}`);

    if (hoursUntil < 0) {
      console.log(`\n⚠️  WARNING: Match time is in the past! This is why it shows "TIEMPO AGOTADO"`);
    } else {
      console.log(`\n✅ Match time is correct (in the future)`);
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTestMatch();
