import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  entities: [],
});

async function run() {
  await AppDataSource.initialize();
  console.log('🔌 Connected to PROD DB for deep introspection');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // 1. Get ALL columns and a sample row from leagues
    const leagueSample = await queryRunner.query(`SELECT * FROM leagues LIMIT 1`);
    if (leagueSample.length > 0) {
        console.log('\n📄 Sample League record keys:', Object.keys(leagueSample[0]).join(', '));
        console.log('Sample Data:', JSON.stringify(leagueSample[0], null, 2));
    } else {
        console.log('❌ No leagues found in the table!');
    }

    // 2. Get ALL columns and a sample row from league_participants
    const partSample = await queryRunner.query(`SELECT * FROM league_participants LIMIT 1`);
    if (partSample.length > 0) {
        console.log('\n👥 Sample Participant record keys:', Object.keys(partSample[0]).join(', '));
    }

    // 3. Find the creator of "FAMILIA" using the correct keys found in step 1
    const keys = Object.keys(leagueSample[0]);
    const creatorKey = keys.find(k => k.toLowerCase().includes('creator')) || 'creator_id';
    
    console.log(`\n🔎 Using creator key: ${creatorKey}`);
    
    const famLeagues = await queryRunner.query(`
      SELECT id, name, "${creatorKey}" as "creator_id"
      FROM leagues 
      WHERE name ILIKE '%FAMILIA%'
    `);
    
    if (famLeagues.length > 0) {
        const userId = famLeagues[0].creator_id;
        console.log(`👤 Found Creator ID of FAMILIA: ${userId}`);

        // 4. Count TOTAL leagues in DB
        const totalLeagues = await queryRunner.query(`SELECT COUNT(*) FROM leagues`);
        console.log(`\n📈 Total Leagues in DB: ${totalLeagues[0].count}`);

        // 5. Count leagues where this user is creator
        const createdCount = await queryRunner.query(`SELECT COUNT(*) FROM leagues WHERE "${creatorKey}" = '${userId}'`);
        console.log(`👑 Leagues created by this user: ${createdCount[0].count}`);

        // 6. Check for participants mapping
        const userKey = Object.keys(partSample[0]).find(k => k.toLowerCase().includes('user')) || 'user_id';
        const leagueKey = Object.keys(partSample[0]).find(k => k.toLowerCase().includes('league')) || 'league_id';

        const participations = await queryRunner.query(`
            SELECT COUNT(*) 
            FROM league_participants 
            WHERE "${userKey}" = '${userId}'
        `);
        console.log(`🏃 Leagues this user is participating in: ${participations[0].count}`);
    }

  } catch (err) {
    console.error('❌ Introspection failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
