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
    // 1. Get ALL unique tournament IDs
    const tournamentIds = await queryRunner.query(`
        SELECT DISTINCT "tournamentId" 
        FROM leagues
    `);
    console.log('\n📅 All Tournament IDs in "leagues" table:');
    tournamentIds.forEach((t: any) => {
        console.log(`- "${t.tournamentId}"`);
    });

    // 2. Count total rows in leagues
    const total = await queryRunner.query(`SELECT COUNT(*) FROM leagues`);
    console.log(`\n📈 Total Leagues rows: ${total[0].count}`);

    // 3. Sample check for some random leagues
    const samples = await queryRunner.query(`
        SELECT id, name, "tournamentId", is_enterprise, "creatorId"
        FROM leagues
        LIMIT 10
    `);
    console.log('\n📁 Samples:', JSON.stringify(samples, null, 2));

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
