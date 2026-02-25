/**
 * Seed UCL2526 knockout phases (con nombres de columna reales de la BD)
 * Columnas: id, phase, is_unlocked, unlocked_at, all_matches_completed, is_manually_locked, tournamentId, created_at, updated_at
 */
const { Client } = require('pg');
const { randomUUID } = require('crypto');

const DB_URL = 'postgresql://postgres:admin123@localhost:5432/polla_mundialista';
const TOURNAMENT_ID = 'UCL2526';

const UCL_PHASES = [
  { phase: 'PLAYOFF_1', is_unlocked: true,  all_matches_completed: true  }, // ida - ya jugado
  { phase: 'PLAYOFF_2', is_unlocked: true,  all_matches_completed: false }, // vuelta - mañana
  { phase: 'ROUND_16',  is_unlocked: false, all_matches_completed: false }, // octavos - pendiente
  { phase: 'QUARTER',   is_unlocked: false, all_matches_completed: false },
  { phase: 'SEMI',      is_unlocked: false, all_matches_completed: false },
  { phase: 'FINAL',     is_unlocked: false, all_matches_completed: false },
];

async function seedUclPhases() {
  const client = new Client({ connectionString: DB_URL });
  await client.connect();
  console.log(`\n🏆 Seeding knockout phases for ${TOURNAMENT_ID}...\n`);

  try {
    // Verificar columnas reales
    const cols = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'knockout_phase_status' ORDER BY ordinal_position
    `);
    console.log('Columnas:', cols.rows.map(r => r.column_name).join(', '));

    for (const p of UCL_PHASES) {
      const existing = await client.query(
        'SELECT id FROM knockout_phase_status WHERE "tournamentId" = $1 AND phase = $2',
        [TOURNAMENT_ID, p.phase]
      );

      if (existing.rows.length > 0) {
        await client.query(
          `UPDATE knockout_phase_status 
           SET is_unlocked = $1, all_matches_completed = $2, updated_at = NOW()
           WHERE "tournamentId" = $3 AND phase = $4`,
          [p.is_unlocked, p.all_matches_completed, TOURNAMENT_ID, p.phase]
        );
        console.log(`  ✏️  UPDATED  ${p.phase} → unlocked=${p.is_unlocked} completed=${p.all_matches_completed}`);
      } else {
        await client.query(
          `INSERT INTO knockout_phase_status (id, phase, is_unlocked, unlocked_at, all_matches_completed, is_manually_locked, "tournamentId", created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, false, $6, NOW(), NOW())`,
          [randomUUID(), p.phase, p.is_unlocked, p.is_unlocked ? new Date() : null, p.all_matches_completed, TOURNAMENT_ID]
        );
        console.log(`  ✅  INSERTED ${p.phase} → unlocked=${p.is_unlocked} completed=${p.all_matches_completed}`);
      }
    }

    console.log('\n📋 Estado final fases UCL2526:');
    const final = await client.query(
      `SELECT phase, is_unlocked, all_matches_completed 
       FROM knockout_phase_status WHERE "tournamentId" = $1 ORDER BY created_at`,
      [TOURNAMENT_ID]
    );
    final.rows.forEach(r => {
      const lock = r.is_unlocked ? '🔓' : '🔒';
      const done = r.all_matches_completed ? '✅' : '⏳';
      console.log(`  ${lock} ${done}  ${r.phase}`);
    });

  } finally {
    await client.end();
    console.log('\n✨ Done!');
  }
}

seedUclPhases().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
