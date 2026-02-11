
import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config(); // Load .env

const dataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  entities: ['apps/api/src/database/entities/*.entity.ts'], // Adjust path if needed or use raw query
});

async function checkData() {
  try {
    await dataSource.initialize();
    console.log('🔌 Connected to DB');

    // 1. Check Predictions Table Structure (implied by query success/fail) and Data
    console.log('\n🔍 CHECKING PREDICTIONS (WC2026)...');
    
    // Check total
    const totalPreds = await dataSource.manager.query(`SELECT COUNT(*) FROM predictions WHERE "tournamentId" = 'WC2026'`);
    console.log(`Total Predictions (WC2026): ${totalPreds[0].count}`);

    // Check league_id IS NULL
    const nullLeague = await dataSource.manager.query(`SELECT COUNT(*) FROM predictions WHERE "tournamentId" = 'WC2026' AND "league_id" IS NULL`);
    console.log(`Predictions with league_id IS NULL (Global Context): ${nullLeague[0].count}`);
    
    // Check league_id IS NOT NULL 
    const bucketLeague = await dataSource.manager.query(`SELECT COUNT(*) FROM predictions WHERE "tournamentId" = 'WC2026' AND "league_id" IS NOT NULL`);
    console.log(`Predictions with league_id SET (League Context): ${bucketLeague[0].count}`);
    
    // Check if column 'leagueId' exists (to see if my previous fix was actually needed or if I broke it)
    try {
        await dataSource.manager.query(`SELECT "leagueId" FROM predictions LIMIT 1`);
        console.log('⚠️ Column "leagueId" EXISTS in predictions!');
    } catch (e) {
        console.log('✅ Column "leagueId" DOES NOT exist (Confirmed league_id is correct)');
    }


    // 2. CHECK USER BRACKETS
    console.log('\n🔍 CHECKING USER BRACKETS (WC2026)...');
    const totalBrackets = await dataSource.manager.query(`SELECT COUNT(*) FROM user_brackets WHERE "tournamentId" = 'WC2026'`);
    console.log(`Total Brackets: ${totalBrackets[0].count}`);
    
    const nullLeagueBrackets = await dataSource.manager.query(`SELECT COUNT(*) FROM user_brackets WHERE "tournamentId" = 'WC2026' AND "leagueId" IS NULL`);
    console.log(`Brackets with leagueId IS NULL: ${nullLeagueBrackets[0].count}`);
    
    // Check if column 'league_id' exists instead of 'leagueId'
    try {
        await dataSource.manager.query(`SELECT "league_id" FROM user_brackets LIMIT 1`);
        console.log('⚠️ Column "league_id" EXISTS in user_brackets (Possible confusion!)');
    } catch (e) {
        console.log('ℹ️ Column "league_id" does NOT exist in user_brackets.');
    }

    // 3. CHECK UCL2526
    console.log('\n🔍 CHECKING PREDICTIONS (UCL2526)...');
    const totalPredsUCL = await dataSource.manager.query(`SELECT COUNT(*) FROM predictions WHERE "tournamentId" = 'UCL2526'`);
    console.log(`Total Predictions (UCL2526): ${totalPredsUCL[0].count}`);
    
    const nullLeagueUCL = await dataSource.manager.query(`SELECT COUNT(*) FROM predictions WHERE "tournamentId" = 'UCL2526' AND "league_id" IS NULL`);
    console.log(`Predictions with league_id IS NULL (UCL): ${nullLeagueUCL[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

checkData();
