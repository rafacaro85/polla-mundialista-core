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

  // Check if knockout_phase_status table exists
  const tables = await queryRunner.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE '%knockout%'
    `);

  console.log('\n📋 Knockout-related tables:');
  console.log(tables);

  if (tables.length > 0) {
    // Check columns
    const columns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'knockout_phase_status'
            ORDER BY ordinal_position
        `);

    console.log('\n📊 knockout_phase_status columns:');
    console.log(columns.map((c: any) => c.column_name));

    // Check data
    const phases = await queryRunner.query(
      `SELECT * FROM knockout_phase_status LIMIT 10`,
    );
    console.log('\n🏆 Knockout Phases:');
    console.log(JSON.stringify(phases, null, 2));
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
