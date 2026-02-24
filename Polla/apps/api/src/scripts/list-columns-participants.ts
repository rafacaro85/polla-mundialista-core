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
    const columns = await queryRunner.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'leagues'
        ORDER BY column_name
    `);
    console.log('\n🔍 leagues Columns (STRICT):');
    columns.forEach((c: any) => console.log(`- ${c.column_name} (${c.data_type})`));

  } catch (err) {
    console.error('❌ Failed to list columns:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
