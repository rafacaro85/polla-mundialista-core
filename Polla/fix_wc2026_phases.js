/**
 * fix_wc2026_phases.js
 *
 * Crea/verifica las entradas de knockout_phase_status para WC2026.
 * El "Error al cargar fases" en el SuperAdmin se debe a que no existen
 * registros para WC2026 en esa tabla.
 *
 * También muestra cuántos partidos hay por fase para diagnosticar
 * el error de simulación.
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Conectado\n');

  try {
    // 1. Ver qué hay actualmente para WC2026
    const existing = await client.query(`
      SELECT phase, "is_unlocked", "all_matches_completed"
      FROM knockout_phase_status
      WHERE "tournamentId" = 'WC2026'
      ORDER BY phase
    `);
    console.log('📋 WC2026 - knockout_phase_status actual:');
    if (existing.rows.length === 0) {
      console.log('   ⚠️  NO HAY REGISTROS - este es el bug del "Error al cargar fases"');
    } else {
      console.table(existing.rows);
    }

    // 2. Ver partidos por fase en WC2026
    const matchCounts = await client.query(`
      SELECT phase, COUNT(*) as count, 
             COUNT(*) FILTER (WHERE status = 'FINISHED') as finished
      FROM matches
      WHERE "tournamentId" = 'WC2026'
      GROUP BY phase
      ORDER BY phase
    `);
    console.log('\n📊 WC2026 - Partidos por fase:');
    console.table(matchCounts.rows);

    // 3. Crear las entradas de fase para WC2026 si no existen
    console.log('\n🔧 Creando/verificando entradas de fase...');

    const WC_PHASES = [
      { phase: 'GROUP',     isUnlocked: true,  note: 'Fase de grupos - abierta' },
      { phase: 'ROUND_32',  isUnlocked: false, note: 'Dieciseisavos - bloqueada' },
      { phase: 'ROUND_16',  isUnlocked: false, note: 'Octavos - bloqueada' },
      { phase: 'QUARTER',   isUnlocked: false, note: 'Cuartos - bloqueada' },
      { phase: 'SEMI',      isUnlocked: false, note: 'Semifinales - bloqueada' },
      { phase: '3RD_PLACE', isUnlocked: false, note: 'Tercer puesto - bloqueada' },
      { phase: 'FINAL',     isUnlocked: false, note: 'Final - bloqueada' },
    ];

    let created = 0, updated = 0;

    for (const ph of WC_PHASES) {
      const check = await client.query(`
        SELECT id FROM knockout_phase_status
        WHERE "tournamentId" = 'WC2026' AND phase = $1
      `, [ph.phase]);

      if (check.rows.length === 0) {
        await client.query(`
          INSERT INTO knockout_phase_status (id, "tournamentId", phase, "is_unlocked", "all_matches_completed", "is_manually_locked")
          VALUES (gen_random_uuid(), 'WC2026', $1, $2, false, false)
        `, [ph.phase, ph.isUnlocked]);
        console.log(`   ✅ CREADA: ${ph.phase} (${ph.note})`);
        created++;
      } else {
        console.log(`   ℹ️  YA EXISTE: ${ph.phase}`);
      }
    }

    console.log(`\n   → ${created} creadas, ${updated} actualizadas`);

    // 4. Verificación final
    const final = await client.query(`
      SELECT phase, "is_unlocked", "all_matches_completed"
      FROM knockout_phase_status
      WHERE "tournamentId" = 'WC2026'
      ORDER BY CASE phase
        WHEN 'GROUP' THEN 1 WHEN 'ROUND_32' THEN 2 WHEN 'ROUND_16' THEN 3
        WHEN 'QUARTER' THEN 4 WHEN 'SEMI' THEN 5 WHEN '3RD_PLACE' THEN 6
        WHEN 'FINAL' THEN 7 ELSE 9 END
    `);
    console.log('\n✅ WC2026 - Estado final de fases:');
    console.table(final.rows);

    console.log('\n🎉 Listo. Recarga el Super Admin y prueba nuevamente el botón Simular.');

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
