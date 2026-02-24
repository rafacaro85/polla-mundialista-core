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
  console.log('🔌 Connected to PROD DB for distribution diagnosis');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // 1. Social vs Enterprise count
    const distribution = await queryRunner.query(`
        SELECT is_enterprise, COUNT(*) 
        FROM leagues 
        GROUP BY is_enterprise
    `);
    console.log('\n📊 League Distribution:');
    distribution.forEach((d: any) => {
        console.log(`- Enterprise: ${d.is_enterprise === true}, Count: ${d.count}`);
    });

    // 2. Count leagues with NO contestants
    const emptyLeagues = await queryRunner.query(`
        SELECT COUNT(*) 
        FROM leagues 
        WHERE id NOT IN (SELECT league_id FROM league_participants)
    `);
    console.log(`\n🚫 Leagues with 0 participants: ${emptyLeagues[0].count}`);

    if (emptyLeagues[0].count > 0) {
        const samples = await queryRunner.query(`
            SELECT name, "tournamentId", is_enterprise
            FROM leagues
            WHERE id NOT IN (SELECT league_id FROM league_participants)
            LIMIT 5
        `);
        console.log('Samples of empty leagues:', JSON.stringify(samples, null, 2));
    }

    // 3. User with most leagues
    const topUsers = await queryRunner.query(`
        SELECT user_id, COUNT(*) as count
        FROM league_participants
        GROUP BY user_id
        ORDER BY count DESC
        LIMIT 5
    `);
    console.log('\n🏆 Top Participants (User IDs):');
    topUsers.forEach((u: any) => {
        console.log(`- User: ${u.user_id}, Leagues: ${u.count}`);
    });

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
