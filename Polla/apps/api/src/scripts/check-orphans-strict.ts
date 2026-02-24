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

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const rawCount = await queryRunner.query(`SELECT count(*) FROM league_participants WHERE user_id IS NULL`);
    console.log(`\n🔴 RAW NULL User count in league_participants: ${rawCount[0].count}`);

    if (rawCount[0].count > 0) {
        const withLeagues = await queryRunner.query(`
            SELECT p.id, p.league_id, l.name
            FROM league_participants p
            LEFT JOIN leagues l ON p.league_id = l.id
            WHERE p.user_id IS NULL
        `);
        console.log(`\n📋 Orphans matching leagues distribution:`);
        withLeagues.forEach((o: any) => {
            console.log(`- Participant ID: ${o.id}, League ID: ${o.league_id}, League Name: ${o.name || 'MISSING'}`);
        });
    }

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
