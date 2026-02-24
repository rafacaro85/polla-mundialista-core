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
  console.log('🔌 Connected to PROD DB for deep audit');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const leaguesToCheck = await queryRunner.query(`
      SELECT id, name, is_enterprise, "tournamentId", creator_id
      FROM leagues
      WHERE id IN ('1376cb1b-eea2-4c4a-934f-25dcdad926c7', '9b0affe8-5c1e-4986-962e-845893d934f3')
    `);
    
    const fs = require('fs');
    fs.writeFileSync('league_check.json', JSON.stringify(leaguesToCheck, null, 2));
    console.log('✅ League check saved to league_check.json');

  } catch (err) {
    console.error('❌ Audit failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
