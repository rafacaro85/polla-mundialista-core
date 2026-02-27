const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  
  console.log('--- LEAGUES ---');
  try {
    const res1 = await client.query('SELECT id, name, access_code_prefix FROM leagues ORDER BY id DESC LIMIT 5;');
    console.table(res1.rows);
  } catch (e) {
    console.error('Error in leagues query:', e.message);
  }
  
  console.log('--- PENDING TRANSACTIONS ---');
  try {
    const res2 = await client.query(`SELECT id, amount, status, reference_code, league_id, user_id, "tournamentId", created_at FROM transactions WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 5;`);
    console.table(res2.rows);
  } catch (e) {
    console.error('Error in transactions query:', e.message);
  }
  
  await client.end();
}

run().catch(console.error);
