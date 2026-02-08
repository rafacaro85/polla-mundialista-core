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

  // Delete all WC2026 knockout matches with defined teams (from simulations)
  const result = await queryRunner.query(`
        DELETE FROM matches
        WHERE "tournamentId" = 'WC2026'
        AND phase IN ('ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL', '3RD_PLACE')
        AND "homeTeam" IS NOT NULL
        AND "homeTeam" != ''
        AND "homeTeam" NOT LIKE '%W%'
        AND "homeTeam" NOT LIKE '%L%'
        AND "homeTeam" NOT LIKE '%RU%'
    `);

  console.log(`✅ Deleted ${result[1]} simulated knockout matches`);

  // Verify
  const remaining = await queryRunner.query(`
        SELECT phase, COUNT(*) as count
        FROM matches
        WHERE "tournamentId" = 'WC2026'
        GROUP BY phase
        ORDER BY phase
    `);

  console.log('\n📊 Remaining WC2026 matches by phase:');
  remaining.forEach((p: any) => {
    console.log(`${p.phase}: ${p.count} matches`);
  });

  await AppDataSource.destroy();
}

run().catch(console.error);
