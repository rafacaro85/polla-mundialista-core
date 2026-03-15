
const { Client } = require('pg');

async function runQuery() {
  const client = new Client({
    connectionString: "postgresql://postgres:admin123@localhost:5432/polla_mundialista",
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT id, "homeTeam", "awayTeam", phase, 
             "group", date, status
      FROM matches 
      WHERE "tournamentId" = 'WC2026'
      AND phase LIKE 'GROUP%'
      ORDER BY date
      LIMIT 20;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

runQuery();
