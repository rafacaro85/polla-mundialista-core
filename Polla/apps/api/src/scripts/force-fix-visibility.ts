import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false },
  synchronize: false,
});

async function fix() {
  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const userId = '65bf8db4-3f6d-407e-8ba0-4a6b2b6a276f'; // User Hotmail
    
    console.log('🛠️ Fixing leagues for user:', userId);

    // 1. Force is_enterprise = false for all their leagues to be sure they show in social
    await queryRunner.query(`
      UPDATE leagues 
      SET is_enterprise = false 
      WHERE creator_id = '${userId}'
    `);
    console.log('✅ Set is_enterprise = false for user leagues');

    // 2. Ensure tournamentId is UCL2526 for OFICINA if it was WC
    await queryRunner.query(`
      UPDATE leagues 
      SET "tournamentId" = 'UCL2526' 
      WHERE id = '1376cb1b-eea2-4c4a-934f-25dcdad926c7'
    `);
    console.log('✅ Ensured OFICINA is UCL2526');

    // 3. Just in case, let's look for ANY league where they are admin but not showing
    const participations = await queryRunner.query(`
        SELECT l.id, l.name, lp.status, lp."isAdmin"
        FROM league_participants lp
        JOIN leagues l ON lp.league_id = l.id
        WHERE lp.user_id = '${userId}'
    `);
    console.log('🏃 Current participations:', participations);

  } catch (err) {
    console.error('❌ Fix failed:', err.message);
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

fix();
