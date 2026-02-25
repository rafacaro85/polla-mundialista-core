const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
  ssl: { rejectUnauthorized: false }
});

// UCL Team logos map (same as seedUCLKnockout)
const LOGOS = {
  'Galatasaray': 'https://upload.wikimedia.org/wikipedia/en/thumb/2/22/Galatasaray_S.K._(crest).svg/1200px-Galatasaray_S.K._(crest).svg.png',
  'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Juventus_FC_2017_icon_(black).svg/1200px-Juventus_FC_2017_icon_(black).svg.png',
  'Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/1200px-Borussia_Dortmund_logo.svg.png',
  'Atalanta': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/30/FC_Atalanta_logo.svg/1200px-FC_Atalanta_logo.svg.png',
  'Monaco': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/ea/AS_Monaco_FC.svg/1200px-AS_Monaco_FC.svg.png',
  'PSG': 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Paris_Saint-Germain_F.C..svg/1200px-Paris_Saint-Germain_F.C..svg.png',
  'Benfica': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fb/Sport_Lisboa_e_Benfica_(logo).svg/1200px-Sport_Lisboa_e_Benfica_(logo).svg.png',
  'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Real_Madrid_CF.svg/1200px-Real_Madrid_CF.svg.png',
  'Qarabag': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/41/Qarabag_FK_logo.svg/1200px-Qarabag_FK_logo.svg.png',
  'Newcastle': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/56/Newcastle_United_Logo.svg/1200px-Newcastle_United_Logo.svg.png',
  'Olympiacos': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/fc/Olympiacos_FC_logo.svg/1200px-Olympiacos_FC_logo.svg.png',
  'Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/59/Bayer_04_Leverkusen_logo.svg/1200px-Bayer_04_Leverkusen_logo.svg.png',
  'Bodo/Glimt': 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3d/FK_Bod%C3%B8%2FGlimt_logo.svg/1200px-FK_Bod%C3%B8%2FGlimt_logo.svg.png',
  'Inter': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/1200px-FC_Internazionale_Milano_2021.svg.png',
  'Club Brujas': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/Club_Brugge_KV_logo.svg/1200px-Club_Brugge_KV_logo.svg.png',
  'Atlético Madrid': 'https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/Atletico_Madrid_2017_logo.svg/1200px-Atletico_Madrid_2017_logo.svg.png',
  'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/thumb/5/53/Arsenal_FC.svg/1200px-Arsenal_FC.svg.png',
  'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_(2002%E2%80%932017).svg/1200px-FC_Bayern_M%C3%BCnchen_logo_(2002%E2%80%932017).svg.png',
  'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Liverpool_FC.svg/1200px-Liverpool_FC.svg.png',
  'Tottenham': 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b4/Tottenham_Hotspur.svg/1200px-Tottenham_Hotspur.svg.png',
  'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/thumb/4/47/FC_Barcelona_%28crest%29.svg/1200px-FC_Barcelona_%28crest%29.svg.png',
  'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/thumb/c/cc/Chelsea_FC.svg/1200px-Chelsea_FC.svg.png',
  'Sporting Lisboa': 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d6/Sporting_CP_%E2%80%93_Badge.svg/1200px-Sporting_CP_%E2%80%93_Badge.svg.png',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Manchester_City_FC_badge.svg/1200px-Manchester_City_FC_badge.svg.png',
};

const getLogo = (name) => LOGOS[name] || '';
const tid = 'UCL2526';

const PLAYOFF_IDA = [
  { h: 'Galatasaray', a: 'Juventus', d: '2026-02-17T17:45:00Z' },
  { h: 'Dortmund', a: 'Atalanta', d: '2026-02-17T20:00:00Z' },
  { h: 'Monaco', a: 'PSG', d: '2026-02-17T20:00:00Z' },
  { h: 'Benfica', a: 'Real Madrid', d: '2026-02-17T20:00:00Z' },
  { h: 'Qarabag', a: 'Newcastle', d: '2026-02-18T17:45:00Z' },
  { h: 'Olympiacos', a: 'Leverkusen', d: '2026-02-18T20:00:00Z' },
  { h: 'Bodo/Glimt', a: 'Inter', d: '2026-02-18T20:00:00Z' },
  { h: 'Club Brujas', a: 'Atlético Madrid', d: '2026-02-18T20:00:00Z' },
];

const PLAYOFF_VUELTA = [
  { h: 'Atlético Madrid', a: 'Club Brujas', d: '2026-02-24T17:45:00Z' },
  { h: 'Newcastle', a: 'Qarabag', d: '2026-02-24T20:00:00Z' },
  { h: 'Leverkusen', a: 'Olympiacos', d: '2026-02-24T20:00:00Z' },
  { h: 'Atalanta', a: 'Dortmund', d: '2026-02-25T17:45:00Z' },
  { h: 'PSG', a: 'Monaco', d: '2026-02-25T20:00:00Z' },
  { h: 'Real Madrid', a: 'Benfica', d: '2026-02-25T20:00:00Z' },
  { h: 'Juventus', a: 'Galatasaray', d: '2026-02-25T20:00:00Z' },
  { h: 'Inter', a: 'Bodo/Glimt', d: '2026-02-24T20:00:00Z' },
];

const OCTAVOS = [
  { date: '2026-03-10T20:00:00Z', home: '', away: 'Arsenal', hp: 'Ganador Play-off', bracketId: 1, stadium: 'Emirates Stadium' },
  { date: '2026-03-10T20:00:00Z', home: '', away: 'Bayern Munich', hp: 'Ganador Play-off', bracketId: 2, stadium: 'Allianz Arena' },
  { date: '2026-03-11T20:00:00Z', home: '', away: 'Liverpool', hp: 'Ganador Play-off', bracketId: 3, stadium: 'Anfield' },
  { date: '2026-03-11T20:00:00Z', home: '', away: 'Tottenham', hp: 'Ganador Play-off', bracketId: 4, stadium: 'Tottenham Hotspur Stadium' },
  { date: '2026-03-17T20:00:00Z', home: '', away: 'Barcelona', hp: 'Ganador Play-off', bracketId: 5, stadium: 'Camp Nou' },
  { date: '2026-03-17T20:00:00Z', home: '', away: 'Chelsea', hp: 'Ganador Play-off', bracketId: 6, stadium: 'Stamford Bridge' },
  { date: '2026-03-18T20:00:00Z', home: '', away: 'Sporting Lisboa', hp: 'Ganador Play-off', bracketId: 7, stadium: 'Estádio José Alvalade' },
  { date: '2026-03-18T20:00:00Z', home: '', away: 'Manchester City', hp: 'Ganador Play-off', bracketId: 8, stadium: 'Etihad Stadium' },
  // Vueltas
  { date: '2026-03-24T20:00:00Z', home: 'Arsenal', away: '', ap: 'Ganador Play-off', bracketId: 1, stadium: 'Emirates Stadium' },
  { date: '2026-03-24T20:00:00Z', home: 'Bayern Munich', away: '', ap: 'Ganador Play-off', bracketId: 2, stadium: 'Allianz Arena' },
  { date: '2026-03-25T20:00:00Z', home: 'Liverpool', away: '', ap: 'Ganador Play-off', bracketId: 3, stadium: 'Anfield' },
  { date: '2026-03-25T20:00:00Z', home: 'Tottenham', away: '', ap: 'Ganador Play-off', bracketId: 4, stadium: 'Tottenham Hotspur Stadium' },
  { date: '2026-03-31T20:00:00Z', home: 'Barcelona', away: '', ap: 'Ganador Play-off', bracketId: 5, stadium: 'Camp Nou' },
  { date: '2026-04-01T20:00:00Z', home: 'Chelsea', away: '', ap: 'Ganador Play-off', bracketId: 6, stadium: 'Stamford Bridge' },
  { date: '2026-04-01T20:00:00Z', home: 'Sporting Lisboa', away: '', ap: 'Ganador Play-off', bracketId: 7, stadium: 'Estádio José Alvalade' },
  { date: '2026-04-01T20:00:00Z', home: 'Manchester City', away: '', ap: 'Ganador Play-off', bracketId: 8, stadium: 'Etihad Stadium' },
];

async function run() {
  await client.connect();
  console.log('✅ Conectado a Railway PostgreSQL\n');

  // Step 0: Delete any existing UCL matches to avoid duplicates
  const del = await client.query(`DELETE FROM matches WHERE "tournamentId" = $1`, [tid]);
  console.log(`🗑️  Borrados ${del.rowCount} partidos UCL existentes`);

  // Check what columns the matches table has
  const cols = await client.query(`
    SELECT column_name FROM information_schema.columns 
    WHERE table_name = 'matches' ORDER BY ordinal_position
  `);
  console.log('📋 Columns in matches table:', cols.rows.map(r => r.column_name).join(', '));

  let inserted = 0;

  // Insert PLAYOFF_1 (ida - already played)
  for (const m of PLAYOFF_IDA) {
    await client.query(
      `INSERT INTO matches ("homeTeam", "awayTeam", "homeFlag", "awayFlag", date, phase, status, "tournamentId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [m.h, m.a, getLogo(m.h), getLogo(m.a), new Date(m.d), 'PLAYOFF_1', 'PENDING', tid]
    );
    inserted++;
  }
  console.log(`✅ PLAYOFF_1 (ida): ${PLAYOFF_IDA.length} partidos insertados`);

  // Insert PLAYOFF_2 (vuelta - mañana!)
  for (const m of PLAYOFF_VUELTA) {
    await client.query(
      `INSERT INTO matches ("homeTeam", "awayTeam", "homeFlag", "awayFlag", date, phase, status, "tournamentId")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [m.h, m.a, getLogo(m.h), getLogo(m.a), new Date(m.d), 'PLAYOFF_2', 'PENDING', tid]
    );
    inserted++;
  }
  console.log(`✅ PLAYOFF_2 (vuelta): ${PLAYOFF_VUELTA.length} partidos insertados`);

  // Insert ROUND_16 (octavos - Marzo)
  for (const m of OCTAVOS) {
    const hasBracketId = cols.rows.some(r => r.column_name === 'bracket_id' || r.column_name === 'bracketId');
    const hasStadium = cols.rows.some(r => r.column_name === 'stadium');
    
    if (hasBracketId && hasStadium) {
      await client.query(
        `INSERT INTO matches ("homeTeam", "awayTeam", "homeFlag", "awayFlag", "homeTeamPlaceholder", "awayTeamPlaceholder", date, phase, status, "tournamentId", "bracketId", stadium)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [m.home, m.away, getLogo(m.home), getLogo(m.away), m.hp || null, m.ap || null, new Date(m.date), 'ROUND_16', 'PENDING', tid, m.bracketId, m.stadium]
      );
    } else {
      await client.query(
        `INSERT INTO matches ("homeTeam", "awayTeam", "homeFlag", "awayFlag", "homeTeamPlaceholder", "awayTeamPlaceholder", date, phase, status, "tournamentId")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [m.home, m.away, getLogo(m.home), getLogo(m.away), m.hp || null, m.ap || null, new Date(m.date), 'ROUND_16', 'PENDING', tid]
      );
    }
    inserted++;
  }
  console.log(`✅ ROUND_16 (octavos): ${OCTAVOS.length} partidos insertados`);

  // Verify final count
  const verify = await client.query(
    `SELECT COUNT(*) as count, "tournamentId" FROM matches GROUP BY "tournamentId" ORDER BY "tournamentId"`
  );
  console.log('\n📊 VERIFICACIÓN FINAL — Partidos por torneo:');
  verify.rows.forEach(r => console.log(`  ${r.tournamentId}: ${r.count} partidos`));

  // Verify UCL by phase  
  const byPhase = await client.query(
    `SELECT phase, COUNT(*) as count FROM matches WHERE "tournamentId" = $1 GROUP BY phase ORDER BY phase`, [tid]
  );
  console.log(`\n📊 UCL Partidos por fase:`);
  byPhase.rows.forEach(r => console.log(`  ${r.phase}: ${r.count}`));

  console.log(`\n✅ TOTAL INSERTADOS: ${inserted}`);
  await client.end();
}

run().catch(e => { console.error('❌ ERROR:', e.message); console.error(e.stack); client.end().catch(() => {}); process.exit(1); });
