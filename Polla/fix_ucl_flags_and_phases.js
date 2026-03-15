/**
 * fix_ucl_flags_and_phases.js
 *
 * 1. Elimina entradas duplicadas QUARTER y SEMI del knockout_phase_status 
 *    (ya existen QUARTER_FINAL y SEMI_FINAL)
 * 2. Copia las banderas reales de los equipos desde los partidos de Octavos
 *    a los partidos de Cuartos
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
    // =====================================================
    // 1. ELIMINAR FASES DUPLICADAS (QUARTER y SEMI viejas)
    // =====================================================
    console.log('🗑️  Eliminando fases QUARTER y SEMI duplicadas...');
    const deleted = await client.query(`
      DELETE FROM knockout_phase_status
      WHERE "tournamentId" = 'UCL2526'
        AND phase IN ('QUARTER', 'SEMI')
      RETURNING phase
    `);
    console.log(`   ✅ Eliminadas: ${deleted.rows.map(r => r.phase).join(', ') || 'ninguna'}\n`);

    // =====================================================
    // 2. COPIAR BANDERAS DESDE OCTAVOS A CUARTOS
    // =====================================================
    console.log('🏳️  Copiando banderas reales de Octavos a Cuartos...');

    // Obtener todos los equipos de Octavos con sus banderas
    const r16Flags = await client.query(`
      SELECT DISTINCT
        CASE WHEN "group" = 'LEG_1' THEN "homeTeam" ELSE "awayTeam" END as team,
        CASE WHEN "group" = 'LEG_1' THEN "homeFlag" ELSE "awayFlag" END as flag
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16'
        AND "group" = 'LEG_1'
      UNION
      SELECT DISTINCT
        CASE WHEN "group" = 'LEG_1' THEN "awayTeam" ELSE "homeTeam" END as team,
        CASE WHEN "group" = 'LEG_1' THEN "awayFlag" ELSE "homeFlag" END as flag
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16'
        AND "group" = 'LEG_1'
    `);

    const teamFlags = {};
    for (const row of r16Flags.rows) {
      if (row.team && row.flag && row.flag !== 'tbd') {
        teamFlags[row.team] = row.flag;
      }
    }
    console.log('   Banderas encontradas:', Object.keys(teamFlags).join(', '));

    // Actualizar banderas en los partidos de Cuartos
    const qfMatches = await client.query(`
      SELECT id, "homeTeam", "awayTeam", "homeFlag", "awayFlag"
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL'
    `);

    let updated = 0;
    for (const m of qfMatches.rows) {
      const newHomeFlag = teamFlags[m.homeTeam] || m.homeFlag;
      const newAwayFlag = teamFlags[m.awayTeam] || m.awayFlag;
      
      if (newHomeFlag !== m.homeFlag || newAwayFlag !== m.awayFlag) {
        await client.query(`
          UPDATE matches SET "homeFlag" = $1, "awayFlag" = $2 WHERE id = $3
        `, [newHomeFlag, newAwayFlag, m.id]);
        updated++;
      }
    }
    console.log(`   ✅ ${updated} partidos de Cuartos con banderas actualizadas\n`);

    // =====================================================
    // 3. VERIFICACIÓN FINAL
    // =====================================================
    const phases = await client.query(`
      SELECT phase, "is_unlocked", "all_matches_completed"
      FROM knockout_phase_status
      WHERE "tournamentId" = 'UCL2526'
      ORDER BY CASE phase
        WHEN 'PLAYOFF_1' THEN 1 WHEN 'PLAYOFF_2' THEN 2
        WHEN 'ROUND_16' THEN 3 WHEN 'QUARTER_FINAL' THEN 4
        WHEN 'SEMI_FINAL' THEN 5 WHEN 'FINAL' THEN 6 ELSE 9 END
    `);
    console.log('✅ Fases UCL2526 en knockout_phase_status:');
    console.table(phases.rows);

    const qfSample = await client.query(`
      SELECT "bracketId", "group", "homeTeam", "awayTeam", "homeFlag", "awayFlag"
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL'
      ORDER BY "bracketId", "group"
    `);
    console.log('✅ Cuartos de Final (banderas):');
    console.table(qfSample.rows);

    console.log('\n🎉 ¡Listo! Recarga la app.');

  } catch (e) {
    console.error('❌ Error:', e.message);
  } finally {
    await client.end();
  }
}

run().catch(console.error);
