
const { Client } = require('pg');
async function run() {
  const c = new Client('postgresql://postgres:admin123@localhost:5432/polla_mundialista');
  await c.connect();
  const res = await c.query('SELECT DISTINCT "tournamentId" FROM matches');
  console.log('Tournament IDs:', res.rows.map(r => r.tournamentId));
  
  const resDemo = await c.query('SELECT id, "tournamentId", "homeTeam", "awayTeam" FROM matches WHERE "tournamentId" LIKE \'%DEMO%\' LIMIT 5');
  console.log('Demo Matches:', JSON.stringify(resDemo.rows, null, 2));
  
  await c.end();
}
run().catch(console.error);
