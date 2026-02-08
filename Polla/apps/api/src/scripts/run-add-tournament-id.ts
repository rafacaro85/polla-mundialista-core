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

  try {
    // Add tournamentId column
    console.log('Adding tournamentId column...');
    await queryRunner.query(`
            ALTER TABLE leagues 
            ADD COLUMN IF NOT EXISTS "tournamentId" varchar DEFAULT 'WC2026'
        `);
    console.log('✅ Column added');

    // Update existing leagues
    console.log('Updating existing leagues...');
    const result = await queryRunner.query(`
            UPDATE leagues 
            SET "tournamentId" = 'WC2026' 
            WHERE "tournamentId" IS NULL
        `);
    console.log(`✅ Updated ${result[1]} leagues`);

    // Verify
    const leagues = await queryRunner.query(
      `SELECT id, name, "tournamentId" FROM leagues LIMIT 5`,
    );
    console.log('\n📊 Sample Leagues:');
    leagues.forEach((league: any) => {
      console.log(`${league.name}: ${league.tournamentId}`);
    });
  } catch (error) {
    console.error('❌ Error:', error);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
