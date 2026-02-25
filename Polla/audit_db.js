const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
  ssl: { rejectUnauthorized: false }
});
async function run() {
  await client.connect();

  // P4-Q1: UCL leagues
  const q1 = await client.query(`
    SELECT id, name, "tournamentId", is_enterprise, type
    FROM leagues 
    WHERE "tournamentId" = 'UCL2526'
    ORDER BY is_enterprise
  `);
  console.log('\n=== UCL2526 LEAGUES ===');
  if (q1.rows.length === 0) console.log('  ❌ NINGUNA liga tiene tournamentId=UCL2526');
  q1.rows.forEach(r => console.log(`  [${r.id.substring(0,8)}] "${r.name}" enterprise=${r.is_enterprise} type=${r.type}`));

  // P4-Q2: Match counts by tournament
  const q2 = await client.query(`
    SELECT COUNT(*) as count, "tournamentId" 
    FROM matches 
    GROUP BY "tournamentId"
    ORDER BY "tournamentId"
  `);
  console.log('\n=== MATCH COUNTS BY TOURNAMENT ===');
  q2.rows.forEach(r => console.log(`  ${r.tournamentId}: ${r.count} partidos`));

  // P4-Q3: UCL knockout phases
  const q3 = await client.query(`
    SELECT phase, is_unlocked, all_matches_completed, "tournamentId"
    FROM knockout_phase_status 
    WHERE "tournamentId" = 'UCL2526'
    ORDER BY CASE phase
      WHEN 'PLAYOFF_1' THEN 1 WHEN 'PLAYOFF_2' THEN 2
      WHEN 'ROUND_16' THEN 3 WHEN 'QUARTER' THEN 4
      WHEN 'SEMI' THEN 5 WHEN 'FINAL' THEN 6 ELSE 9 END
  `);
  console.log('\n=== UCL2526 KNOCKOUT PHASE_STATUS ===');
  q3.rows.forEach(r => {
    const s = r.is_unlocked ? '🔓UNLOCKED' : '🔒LOCKED';
    console.log(`  ${s} ${r.phase} | completed=${r.all_matches_completed}`);
  });

  // BONUS: WC2026 phases for comparison
  const q4 = await client.query(`
    SELECT phase, is_unlocked FROM knockout_phase_status 
    WHERE "tournamentId" = 'WC2026' ORDER BY phase
  `);
  console.log('\n=== WC2026 KNOCKOUT PHASE_STATUS ===');
  q4.rows.forEach(r => console.log(`  ${r.is_unlocked ? '🔓' : '🔒'} ${r.phase}`));

  // BONUS: Sample UCL matches to confirm phase names
  const q5 = await client.query(`
    SELECT phase, COUNT(*) as count FROM matches 
    WHERE "tournamentId" = 'UCL2526' 
    GROUP BY phase ORDER BY phase
  `);
  console.log('\n=== UCL MATCH PHASES ===');
  q5.rows.forEach(r => console.log(`  ${r.phase}: ${r.count} partidos`));

  // BONUS: DashboardClient route context
  const q6 = await client.query(`
    SELECT id, name, type, "tournamentId", is_enterprise
    FROM leagues ORDER BY name LIMIT 20
  `);
  console.log('\n=== ALL LEAGUES ===');
  q6.rows.forEach(r => console.log(`  [${r.id.substring(0,8)}] "${r.name}" tournamentId=${r.tournamentId} enterprise=${r.is_enterprise}`));

  await client.end();
}
run().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
