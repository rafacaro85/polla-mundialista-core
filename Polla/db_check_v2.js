const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    const res = await client.query('SELECT id, league_id as "leagueId", "tournamentId", status, amount, created_at as "createdAt" FROM transactions ORDER BY created_at DESC LIMIT 10;');
    console.table(res.rows);
  } catch (e) {
    console.error('Error in transactions query:', e.message);
  }
  await client.end();
}

run().catch(console.error);
