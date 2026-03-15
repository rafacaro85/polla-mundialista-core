
const { Client } = require('pg');
async function run() {
  const c = new Client('postgresql://postgres:admin123@localhost:5432/polla_mundialista');
  await c.connect();
  const res = await c.query('SELECT id, phase, "group", "homeTeam", "awayTeam" FROM matches WHERE "tournamentId" = \'UCL2526\' LIMIT 10');
  console.log('UCL Matches:');
  console.log(JSON.stringify(res.rows, null, 2));
  await c.end();
}
run().catch(console.error);
