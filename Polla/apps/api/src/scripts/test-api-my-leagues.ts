import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false },
  synchronize: false,
});

async function test() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const userId = '65bf8db4-3f6d-407e-8ba0-4a6b2b6a276f'; // User Hotmail
    
    const data = await queryRunner.query(`
      SELECT 
        l.id, 
        l.name, 
        l."tournamentId", 
        l.is_enterprise,
        lp.status as user_status,
        lp."isAdmin"
      FROM league_participants lp
      JOIN leagues l ON lp.league_id = l.id
      WHERE lp.user_id = '${userId}'
    `);
    
    console.log('📦 API Simulation for /leagues/my:');
    console.log(JSON.stringify(data, null, 2));

  } catch (err) {
    console.error('❌ Test failed:', err.message);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

test();
