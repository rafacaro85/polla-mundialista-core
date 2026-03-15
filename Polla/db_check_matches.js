const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista',
});

async function run() {
  await client.connect();
  const res = await client.query(`SELECT "id", "homeTeam", "awayTeam", "phase", "group", "bracketId" FROM "matches" WHERE "tournamentId" = 'UCL2526' LIMIT 5`);
  console.log(res.rows);
  await client.end();
}

run();
