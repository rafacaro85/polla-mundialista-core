const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, text, "isActive", league_id, "tournamentId" FROM bonus_questions ORDER BY "createdAt" DESC LIMIT 5');
  console.log("LAST 5 QUESTIONS:", res.rows);
  await client.end();
}

run().catch(console.error);
