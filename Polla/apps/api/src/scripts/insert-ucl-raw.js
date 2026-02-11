const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
try {
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('📖 Leyendo .env desde:', envPath);
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Variables de entorno cargadas manualmente.');
  }
} catch (e) {
  console.error('❌ Error leyendo .env:', e);
}

// Disable SSL for this script execution
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// DATA DEFINITIONS
const TEAMS = {
  'Manchester City': 'gb-eng',
  'Real Madrid': 'es',
  'Bayern Munich': 'de',
  Liverpool: 'gb-eng',
  'Inter Milan': 'it',
  Arsenal: 'gb-eng',
  Barcelona: 'es',
  PSG: 'fr',
  'Atletico Madrid': 'es',
  'Borussia Dortmund': 'de',
  'Bayer Leverkusen': 'de',
  Juventus: 'it',
  'AC Milan': 'it',
  Benfica: 'pt',
  'Aston Villa': 'gb-eng',
  PSV: 'nl',
};

function getLogo(team) {
  const code = TEAMS[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
}

const TARGET_TOURNAMENT_ID = 'UCL2526';

const MATCHES = [
  { date: '2026-02-17T20:00:00Z', home: 'PSV', away: 'Arsenal', group: 'R16', stadium: 'Philips Stadion' },
  { date: '2026-02-17T20:00:00Z', home: 'Benfica', away: 'Real Madrid', group: 'R16', stadium: 'Estádio da Luz' },
  { date: '2026-02-18T20:00:00Z', home: 'Juventus', away: 'Manchester City', group: 'R16', stadium: 'Allianz Stadium' },
  { date: '2026-02-18T20:00:00Z', home: 'AC Milan', away: 'Liverpool', group: 'R16', stadium: 'San Siro' },
  { date: '2026-02-24T20:00:00Z', home: 'Atletico Madrid', away: 'Bayern Munich', group: 'R16', stadium: 'Metropolitano' },
  { date: '2026-02-24T20:00:00Z', home: 'Bayer Leverkusen', away: 'Inter Milan', group: 'R16', stadium: 'BayArena' },
  { date: '2026-02-25T20:00:00Z', home: 'Aston Villa', away: 'Barcelona', group: 'R16', stadium: 'Villa Park' },
  { date: '2026-02-25T20:00:00Z', home: 'Borussia Dortmund', away: 'PSG', group: 'R16', stadium: 'Signal Iduna Park' },
  { date: '2026-03-10T20:00:00Z', home: 'Arsenal', away: 'PSV', group: 'R16', stadium: 'Emirates Stadium' },
  { date: '2026-03-10T20:00:00Z', home: 'Real Madrid', away: 'Benfica', group: 'R16', stadium: 'Santiago Bernabéu' },
  { date: '2026-03-11T20:00:00Z', home: 'Manchester City', away: 'Juventus', group: 'R16', stadium: 'Etihad Stadium' },
  { date: '2026-03-11T20:00:00Z', home: 'Liverpool', away: 'AC Milan', group: 'R16', stadium: 'Anfield' },
  { date: '2026-03-17T20:00:00Z', home: 'Bayern Munich', away: 'Atletico Madrid', group: 'R16', stadium: 'Allianz Arena' },
  { date: '2026-03-17T20:00:00Z', home: 'Inter Milan', away: 'Bayer Leverkusen', group: 'R16', stadium: 'San Siro' },
  { date: '2026-03-18T20:00:00Z', home: 'Barcelona', away: 'Aston Villa', group: 'R16', stadium: 'Camp Nou' },
  { date: '2026-03-18T20:00:00Z', home: 'PSG', away: 'Borussia Dortmund', group: 'R16', stadium: 'Parc des Princes' },
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
    console.log('✅ Conexión a DB establecida para INYECCIÓN RAW SQL');

    // 1. Safety Check
    const countRes = await client.query('SELECT COUNT(*) FROM matches WHERE "tournamentId" = $1', [TARGET_TOURNAMENT_ID]);
    const existingCount = parseInt(countRes.rows[0].count, 10);

    if (existingCount > 0) {
      console.warn(`⚠️  ALERTA: Ya existen ${existingCount} partidos con ID ${TARGET_TOURNAMENT_ID}. Abortando.`);
      await client.end();
      process.exit(0);
    }

    console.log(`🌍 Iniciando inyección de ${MATCHES.length} partidos...`);
    let insertedCount = 0;

    for (const m of MATCHES) {
      const query = `
        INSERT INTO matches 
        ("tournamentId", "homeTeam", "awayTeam", "homeFlag", "awayFlag", "date", "group", "phase", "stadium", "status", "isManuallyLocked")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `;
      
      const values = [
        TARGET_TOURNAMENT_ID,
        m.home,
        m.away,
        getLogo(m.home),
        getLogo(m.away),
        m.date,
        m.group,
        'ROUND_16',
        m.stadium,
        'SCHEDULED',
        false
      ];

      await client.query(query, values);
      insertedCount++;
    }

    console.log(`\n🎉 INYECCIÓN COMPLETADA. Se agregaron ${insertedCount} partidos.`);
    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en Inyección RAW:', error);
    process.exit(1);
  }
}

seed();
