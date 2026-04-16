const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@66.33.22.244:13451/railway";

async function check() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check all matches in UCL2526 sorted by phase
    const res = await client.query(`
      SELECT id, "homeTeam", "awayTeam", phase, "group", "bracketId", date, status
      FROM matches 
      WHERE "tournamentId" = 'UCL2526' 
      ORDER BY phase, "group"
    `);
    
    console.log(res.rows);

  } catch (err) {
    console.error('❌ Error fatal:', err);
  } finally {
    await client.end();
  }
}

check();
