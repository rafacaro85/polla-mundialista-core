const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const res = await client.query(`SELECT id, phase, status, "homeTeam", "awayTeam", date FROM match WHERE "tournamentId" = 'UCL2526' AND phase IN ('ROUND_16', 'QUARTER', 'SEMI') ORDER BY phase, date`);
  console.log(JSON.stringify(res.rows, null, 2));
  await client.end();
}

run();
