const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();

  // Check if there are matches with null/empty tournamentId (UCL might be saved with null)
  const q1 = await client.query(`
    SELECT COALESCE("tournamentId", 'NULL') as tournament, count(*) 
    FROM matches GROUP BY "tournamentId" ORDER BY count DESC
  `);
  console.log('\n=== ALL MATCHES BY TOURNAMENT (including null) ===');
  q1.rows.forEach(r => console.log(`  "${r.tournament}": ${r.count}`));

  // Check matches with phase like PLAYOFF (UCL phases)
  const q2 = await client.query(`
    SELECT phase, "tournamentId", COUNT(*) FROM matches 
    WHERE phase LIKE 'PLAYOFF%' GROUP BY phase, "tournamentId"
  `);
  console.log('\n=== PLAYOFF MATCHES (regardless of tournamentId) ===');
  if (q2.rows.length === 0) console.log('  ❌ NO PLAYOFF MATCHES IN DB AT ALL');
  q2.rows.forEach(r => console.log(`  phase=${r.phase} tournamentId=${r.tournamentId}: ${r.count}`));

  // Check total match count and latest inserted
  const q3 = await client.query(`
    SELECT "tournamentId", phase, "createdAt" FROM matches 
    ORDER BY "createdAt" DESC LIMIT 10
  `);
  console.log('\n=== LAST 10 MATCHES INSERTED ===');
  q3.rows.forEach(r => console.log(`  [${r.createdAt?.toISOString()}] ${r.tournamentId} / ${r.phase}`));

  // Check if leagues table has a "package_type" column
  const q4 = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'leagues' ORDER BY column_name
  `);
  console.log('\n=== LEAGUES TABLE COLUMNS ===');
  console.log('  ' + q4.rows.map(r => r.column_name).join(', '));

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
