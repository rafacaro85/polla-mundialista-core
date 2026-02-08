import { DataSource } from 'typeorm';

async function checkTypes() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await ds.initialize();

    const tables = [
      'matches',
      'predictions',
      'user_brackets',
      'league_participants',
      'knockout_phase_status',
    ];
    for (const table of tables) {
      console.log(`\n--- ${table} ---`);
      const columns = await ds.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = '${table}'
            ORDER BY column_name
        `);
      console.table(columns);
    }
  } catch (e) {
    console.error(e);
  } finally {
    await ds.destroy();
  }
}

checkTypes();
