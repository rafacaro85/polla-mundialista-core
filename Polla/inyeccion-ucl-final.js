const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error('❌ Error reading .env:', e);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// ------------------------------------------------------------------
// CONFIG DATA
// ------------------------------------------------------------------
const TARGET_TOURNAMENT_ID = 'UCL2526';

// Full Team Flag Mapping (Country Codes for FlagCDN)
const TEAM_FLAGS = {
  'Galatasaray': 'tr',
  'Juventus': 'it',
  'Dortmund': 'de',
  'Atalanta': 'it',
  'Mónaco': 'fr', // Monaco plays in French league, uses French flag usually in this context or MC
  'PSG': 'fr',
  'Benfica': 'pt',
  'Real Madrid': 'es',
  'Qarabağ': 'az',
  'Newcastle': 'gb-eng',
  'Olympiacos': 'gr',
  'Leverkusen': 'de',
  'Club Brujas': 'be',
  'Atlético Madrid': 'es',
  'Bodø/Glimt': 'no',
  'Inter': 'it',
  'PSV': 'nl',
  'Arsenal': 'gb-eng',
  'AC Milan': 'it',
  'Liverpool': 'gb-eng',
  'Aston Villa': 'gb-eng',
  'Barcelona': 'es',
  'Bayern Munich': 'de',
  'Bayer Leverkusen': 'de', // Duplicate check
  'Sporting CP': 'pt',
  'Sturm Graz': 'at',
  'Brest': 'fr',
  'Shakhtar': 'ua',
  'Dinamo Zagreb': 'hr',
  'Salzburg': 'at',
  'Lille': 'fr',
  'Red Star': 'rs',
  'Young Boys': 'ch',
  'Slovan Bratislava': 'sk',
  'Celtic': 'gb-sct',
  'Sparta Prague': 'cz',
  'Girona': 'es',
  'Bologna': 'it',
  'Leipzig': 'de',
  'Feyenoord': 'nl'
};

function getLogo(teamName) {
  // Normalize
  const key = Object.keys(TEAM_FLAGS).find(k => k.toLowerCase() === teamName.toLowerCase());
  const code = key ? TEAM_FLAGS[key] : null;
  
  if (!code) return ''; 
  // Monaco exception handling if needed, usually 'mc' or 'fr'
  if (code === 'mc') return 'https://flagcdn.com/w40/mc.png';
  return `https://flagcdn.com/w40/${code}.png`;
}

// ------------------------------------------------------------------
// MATCHES DATA (Inferred from images + Logic)
// ------------------------------------------------------------------

// IDA Matches (PLAYOFF_1) - Feb 17/18
const MATCHES_IDA = [
    // Martes 17 Feb - Imagen 1
    { date: '2026-02-17T12:45:00-05:00', home: 'Galatasaray', away: 'Juventus', stadium: 'RAMS Park' },
    { date: '2026-02-17T15:00:00-05:00', home: 'Dortmund', away: 'Atalanta', stadium: 'Signal Iduna Park' },
    { date: '2026-02-17T15:00:00-05:00', home: 'Mónaco', away: 'PSG', stadium: 'Stade Louis II' },
    { date: '2026-02-17T15:00:00-05:00', home: 'Benfica', away: 'Real Madrid', stadium: 'Estádio da Luz' },

    // Miercoles 18 Feb - Imagen 1 + Inferred
    { date: '2026-02-18T12:45:00-05:00', home: 'Qarabağ', away: 'Newcastle', stadium: 'Tofiq Bahramov' },
    { date: '2026-02-18T15:00:00-05:00', home: 'Olympiacos', away: 'Leverkusen', stadium: 'Georgios Karaiskakis' },
    // Inferred from Vuelta (Not in Image 1 but logically exist)
    { date: '2026-02-18T12:45:00-05:00', home: 'Club Brujas', away: 'Atlético Madrid', stadium: 'Jan Breydel' }, // Inferred
    { date: '2026-02-18T15:00:00-05:00', home: 'Bodø/Glimt', away: 'Inter', stadium: 'Aspmyra Stadion' }, // Inferred
];

// VUELTA Matches (PLAYOFF_2) - Feb 24/25 - Imagen 2
const MATCHES_VUELTA = [
    // Martes 24 Feb
    { date: '2026-02-24T12:45:00-05:00', home: 'Atlético Madrid', away: 'Club Brujas', stadium: 'Metropolitano' },
    { date: '2026-02-24T15:00:00-05:00', home: 'Newcastle', away: 'Qarabağ', stadium: 'St James Park' },
    { date: '2026-02-24T15:00:00-05:00', home: 'Leverkusen', away: 'Olympiacos', stadium: 'BayArena' },
    { date: '2026-02-24T15:00:00-05:00', home: 'Inter', away: 'Bodø/Glimt', stadium: 'San Siro' },

    // Miercoles 25 Feb
    { date: '2026-02-25T12:45:00-05:00', home: 'Atalanta', away: 'Dortmund', stadium: 'Gewiss Stadium' },
    { date: '2026-02-25T15:00:00-05:00', home: 'Juventus', away: 'Galatasaray', stadium: 'Allianz Stadium' },
    { date: '2026-02-25T15:00:00-05:00', home: 'PSG', away: 'Mónaco', stadium: 'Parc des Princes' },
    { date: '2026-02-25T15:00:00-05:00', home: 'Real Madrid', away: 'Benfica', stadium: 'Santiago Bernabéu' },
];

async function seed() {
  const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        ssl: false
      };

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ Connected to DB');

    // 1. CLEANUP (Delete existing matches for this tournament to avoid duplicates)
    // We strictly assume we are replacing the Play-off schedule.
    const cleanupQuery = `DELETE FROM matches WHERE "tournamentId" = $1 AND (phase = 'PLAYOFF' OR phase = 'ROUND_16' OR phase = 'PLAYOFF_1' OR phase = 'PLAYOFF_2')`;
    const cleanRes = await client.query(cleanupQuery, [TARGET_TOURNAMENT_ID]);
    console.log(`🧹 Cleaned up ${cleanRes.rowCount} existing matches.`);

    // 2. INSERT IDA MATCHES
    for (const m of MATCHES_IDA) {
      await insertMatch(client, m, 'PLAYOFF_1', 'IDA');
    }

    // 3. INSERT VUELTA MATCHES
    for (const m of MATCHES_VUELTA) {
      await insertMatch(client, m, 'PLAYOFF_2', 'VUELTA');
    }

    // 4. UPDATE PHASES LOCKS
    // PLAYOFF_1 -> Unlocked
    // PLAYOFF_2 -> Locked
    // ROUND_16 -> Locked
    await updatePhaseStatus(client, 'PLAYOFF_1', true);
    await updatePhaseStatus(client, 'PLAYOFF_2', false);
    await updatePhaseStatus(client, 'ROUND_16', false);
    await updatePhaseStatus(client, 'PLAYOFF', false); // Disable generic playoff phase if it exists

    console.log('\n🎉 INJECTION COMPLETE. All matches inserted and phases configured.');
    await client.end();

  } catch (error) {
    console.error('❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

async function insertMatch(client, m, phase, groupLabel) {
    const query = `
      INSERT INTO matches 
      ("tournamentId", "homeTeam", "awayTeam", "homeFlag", "awayFlag", "date", "group", "phase", "stadium", "status", "isManuallyLocked")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    // Convert local time string to UTC Date object or let Postgres handle it?
    // Postgres with timestamp usually expects ISO. The strings above are ISO-like with offset.
    // '2026-02-17T12:45:00-05:00' is standard ISO. No manual conversion needed if PG is configured right.
    
    // Fallback logo if missing
    let homeFlag = getLogo(m.home);
    let awayFlag = getLogo(m.away);

    if (!homeFlag) console.warn(`⚠️ No flag for ${m.home}`);
    if (!awayFlag) console.warn(`⚠️ No flag for ${m.away}`);

    const values = [
      TARGET_TOURNAMENT_ID,
      m.home,
      m.away,
      homeFlag,
      awayFlag,
      m.date,
      groupLabel, // Display text on card (e.g., 'IDA')
      phase,      // Internal phase ID (e.g., 'PLAYOFF_1')
      m.stadium,
      'SCHEDULED',
      false
    ];

    await client.query(query, values);
    process.stdout.write('.');
}

async function updatePhaseStatus(client, phase, isUnlocked) {
    const query = `
        INSERT INTO knockout_phase_status 
        ("tournamentId", "phase", "is_unlocked", "all_matches_completed", "is_manually_locked")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT ("tournamentId", "phase") DO UPDATE 
        SET "is_unlocked" = EXCLUDED."is_unlocked";
    `;
    await client.query(query, [TARGET_TOURNAMENT_ID, phase, isUnlocked, false, false]);
    console.log(`\n🔒 Phase ${phase} -> Unlocked: ${isUnlocked}`);
}

seed();
