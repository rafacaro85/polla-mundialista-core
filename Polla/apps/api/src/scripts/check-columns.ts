import { DataSource } from 'typeorm';

async function checkColumns() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await ds.initialize();

    for (const table of [
      'matches',
      'predictions',
      'user_brackets',
      'league_participants',
      'knockout_phase_status',
    ]) {
      console.log(`\n--- ${table} ---`);
      const cols = await ds.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}'`,
      );
      console.log(cols.map((c: any) => c.column_name).join(', '));
    }
  } catch (e) {
    console.error(e);
  } finally {
    await ds.destroy();
  }
}

checkColumns();
