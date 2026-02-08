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
  console.log('🔌 Connected to PROD DB');

  const queryRunner = AppDataSource.createQueryRunner();

  // Update all leagues with NULL tournament_id to WC2026 (default)
  const result = await queryRunner.query(`
        UPDATE leagues 
        SET tournament_id = 'WC2026' 
        WHERE tournament_id IS NULL
    `);

  console.log(
    `✅ Updated ${result[1]} leagues to have tournament_id = 'WC2026'`,
  );

  // Verify
  const leagues = await queryRunner.query(
    `SELECT id, name, tournament_id FROM leagues LIMIT 10`,
  );
  console.log('\n📊 Updated Leagues:');
  leagues.forEach((league: any) => {
    console.log(`${league.name}: ${league.tournament_id}`);
  });

  await AppDataSource.destroy();
}

run().catch(console.error);
