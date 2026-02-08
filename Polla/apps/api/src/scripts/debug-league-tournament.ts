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

  // First, check what columns exist
  const leagueColumns = await queryRunner.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'leagues'
        ORDER BY ordinal_position
    `);
  console.log('\n📋 Leagues Table Columns:');
  console.log(leagueColumns.map((c: any) => c.column_name));

  // Check all leagues
  const leagues = await queryRunner.query(`
        SELECT * 
        FROM leagues 
        LIMIT 3
    `);

  console.log('\n📊 Enterprise Leagues in Production:');
  console.log(JSON.stringify(leagues, null, 2));

  // Check knockout phases status for WC2026
  const wcPhases = await queryRunner.query(`
        SELECT phase, "isUnlocked", "unlockedAt", "allMatchesCompleted", "tournamentId"
        FROM knockout_phase_status
        WHERE "tournamentId" = 'WC2026'
        ORDER BY "createdAt"
    `);

  console.log('\n🏆 WC2026 Knockout Phases Status:');
  console.log(JSON.stringify(wcPhases, null, 2));

  // Check knockout phases status for UCL
  const uclPhases = await queryRunner.query(`
        SELECT phase, "isUnlocked", "unlockedAt", "allMatchesCompleted", "tournamentId"
        FROM knockout_phase_status
        WHERE "tournamentId" = 'UCL2526'
        ORDER BY "createdAt"
    `);

  console.log('\n⚽ UCL2526 Knockout Phases Status:');
  console.log(JSON.stringify(uclPhases, null, 2));

  await AppDataSource.destroy();
}

run().catch(console.error);
