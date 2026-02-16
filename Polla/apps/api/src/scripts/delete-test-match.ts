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

async function deleteTestMatch() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    // First, verify the test match exists
    const testMatch = await AppDataSource.query(`
      SELECT id, "homeTeam", "awayTeam", "externalId", "group"
      FROM matches 
      WHERE "externalId" = 1505992
    `);

    if (testMatch.length === 0) {
      console.log('⚠️  Test match not found (already deleted?)');
      process.exit(0);
    }

    console.log('📊 Found test match:');
    console.log(`   ID: ${testMatch[0].id}`);
    console.log(`   Match: ${testMatch[0].homeTeam} vs ${testMatch[0].awayTeam}`);
    console.log(`   External ID: ${testMatch[0].externalId}`);
    console.log(`   Group: ${testMatch[0].group}`);

    // Delete associated predictions first (cascade)
    const deletedPredictions = await AppDataSource.query(`
      DELETE FROM predictions 
      WHERE "matchId" = $1
      RETURNING id
    `, [testMatch[0].id]);

    console.log(`\n🗑️  Deleted ${deletedPredictions.length} prediction(s) associated with test match`);

    // Delete the test match
    await AppDataSource.query(`
      DELETE FROM matches 
      WHERE "externalId" = 1505992
    `);

    console.log('✅ Test match deleted successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Removed: ${testMatch[0].homeTeam} vs ${testMatch[0].awayTeam}`);
    console.log(`   - Predictions deleted: ${deletedPredictions.length}`);
    console.log('   - Champions League matches: UNTOUCHED ✅');

    // Verify UCL matches are still there
    const uclMatches = await AppDataSource.query(`
      SELECT COUNT(*) as count
      FROM matches 
      WHERE "tournamentId" = 'UCL2526'
    `);

    console.log(`\n✅ Verification: ${uclMatches[0].count} UCL matches still in database`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteTestMatch();
