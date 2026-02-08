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

  // Unlock all WC2026 phases
  const result = await queryRunner.query(`
        UPDATE knockout_phase_status 
        SET is_unlocked = true, unlocked_at = NOW()
        WHERE "tournamentId" = 'WC2026'
        AND is_unlocked = false
    `);

  console.log(`✅ Unlocked ${result[1]} WC2026 phases`);

  // Verify
  const phases = await queryRunner.query(`
        SELECT phase, is_unlocked, "tournamentId"
        FROM knockout_phase_status
        WHERE "tournamentId" = 'WC2026'
        ORDER BY phase
    `);

  console.log('\n🏆 WC2026 Phases Status:');
  phases.forEach((p: any) => {
    console.log(`${p.phase}: ${p.is_unlocked ? '✅ UNLOCKED' : '🔒 LOCKED'}`);
  });

  await AppDataSource.destroy();
}

run().catch(console.error);
