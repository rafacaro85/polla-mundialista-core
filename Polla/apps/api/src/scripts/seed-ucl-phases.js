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

const TARGET_TOURNAMENT_ID = 'UCL2526';

const PHASES = [
  { phase: 'PLAYOFF', isUnlocked: false },
  { phase: 'ROUND_16', isUnlocked: true }, // Unlocking this because matches were injected as ROUND_16
  { phase: 'QUARTER', isUnlocked: false },
  { phase: 'SEMI', isUnlocked: false },
  { phase: 'FINAL', isUnlocked: false },
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
    console.log('✅ Conexión a DB establecida para SEED de FASES UCL');

    // 1. Clean existing statuses for UCL to avoid duplicates
    await client.query('DELETE FROM knockout_phase_status WHERE "tournamentId" = $1', [TARGET_TOURNAMENT_ID]);
    console.log(`🗑️  Fases previas de ${TARGET_TOURNAMENT_ID} eliminadas.`);

    // 2. Insert new statuses
    for (const p of PHASES) {
      const query = `
        INSERT INTO knockout_phase_status 
        (phase, "tournamentId", is_unlocked, all_matches_completed, unlocked_at)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const values = [
        p.phase,
        TARGET_TOURNAMENT_ID,
        p.isUnlocked,
        false,
        p.isUnlocked ? new Date() : null
      ];

      await client.query(query, values);
      console.log(`✅ Fase ${p.phase} creada (${p.isUnlocked ? 'DESBLOQUEADA' : 'BLOQUEADA'}).`);
    }

    console.log(`\n🎉 SEED DE FASES COMPLETADO PARA ${TARGET_TOURNAMENT_ID}`);
    await client.end();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error en Seed de Fases:', error);
    process.exit(1);
  }
}

seed();
