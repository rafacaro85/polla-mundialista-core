/**
 * seed_ucl_knockout.js
 * 
 * Script directo para crear los partidos de Cuartos, Semis y Final de la UCL 25/26
 * en la base de datos PostgreSQL de Railway.
 * 
 * USO:
 *   node seed_ucl_knockout.js
 * 
 * IMPORTANTE: Este script NO borra los partidos de Octavos (ROUND_16).
 * Solo borra y recrea QUARTER_FINAL, SEMI_FINAL y FINAL.
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Conectado a PostgreSQL Railway');

  try {
    // ========================================================
    // 1. DIAGNÓSTICO: Ver qué partidos de ROUND_16 existen
    // ========================================================
    const r16 = await client.query(`
      SELECT id, "bracketId", "group", "homeTeam", "awayTeam", status
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16'
      ORDER BY "bracketId", "group"
    `);
    console.log('\n📋 PARTIDOS OCTAVOS de FINAL existentes:');
    console.table(r16.rows.map(r => ({ bracketId: r.bracketId, grupo: r.group, home: r.homeTeam, away: r.awayTeam, status: r.status })));

    // ========================================================
    // 2. DIAGNÓSTICO: Ver si ya existen Cuartos/Semis/Final
    // ========================================================
    const existing = await client.query(`
      SELECT phase, COUNT(*) as count
      FROM matches
      WHERE "tournamentId" = 'UCL2526'
        AND phase IN ('QUARTER_FINAL', 'SEMI_FINAL', 'FINAL')
      GROUP BY phase
    `);
    console.log('\n📋 Partidos existentes por fase:');
    console.table(existing.rows);

    const totalExisting = existing.rows.reduce((sum, r) => sum + parseInt(r.count), 0);
    
    if (totalExisting > 0) {
      console.log('\n🗑️  Borrando partidos existentes de QUARTER_FINAL, SEMI_FINAL y FINAL...');
      const deleted = await client.query(`
        DELETE FROM matches
        WHERE "tournamentId" = 'UCL2526'
          AND phase IN ('QUARTER_FINAL', 'SEMI_FINAL', 'FINAL')
        RETURNING id, phase, "bracketId"
      `);
      console.log(`   ✅ Eliminados ${deleted.rowCount} partidos.`);
    }

    // ========================================================
    // 3. INSERTAR CUARTOS DE FINAL
    // Cruces según sorteo oficial UCL 25/26:
    //   Llave 1 (bracketId=1): PSG vs Chelsea
    //   Llave 2 (bracketId=2): Galatasaray/Liverpool
    //   Llave 3 (bracketId=3): Real Madrid vs Man City
    //   Llave 4 (bracketId=4): Atalanta/Bayern
    //   Llave 5 (bracketId=5): Newcastle/Barcelona
    //   Llave 6 (bracketId=6): Atl. Madrid/Tottenham
    //   Llave 7 (bracketId=7): Bodø/Sporting
    //   Llave 8 (bracketId=8): Leverkusen/Arsenal
    //
    // Cuartos: Ganador1 vs Ganador2, Ganador3 vs Ganador4, etc.
    // ========================================================
    console.log('\n📥 Insertando Cuartos de Final (QUARTER_FINAL)...');
    
    const QF_MATCHES = [
      // Cuarto bracketId=9: Ganador del 1 vs Ganador del 2
      { bracketId: 9,  leg: 'LEG_1', date: '2026-04-08T20:00:00Z', homePh: 'Ganador 1', awayPh: 'Ganador 2' },
      { bracketId: 9,  leg: 'LEG_2', date: '2026-04-15T20:00:00Z', homePh: 'Ganador 2', awayPh: 'Ganador 1' },
      // Cuarto bracketId=10: Ganador del 3 vs Ganador del 4
      { bracketId: 10, leg: 'LEG_1', date: '2026-04-08T20:00:00Z', homePh: 'Ganador 3', awayPh: 'Ganador 4' },
      { bracketId: 10, leg: 'LEG_2', date: '2026-04-15T20:00:00Z', homePh: 'Ganador 4', awayPh: 'Ganador 3' },
      // Cuarto bracketId=11: Ganador del 5 vs Ganador del 6
      { bracketId: 11, leg: 'LEG_1', date: '2026-04-09T20:00:00Z', homePh: 'Ganador 5', awayPh: 'Ganador 6' },
      { bracketId: 11, leg: 'LEG_2', date: '2026-04-16T20:00:00Z', homePh: 'Ganador 6', awayPh: 'Ganador 5' },
      // Cuarto bracketId=12: Ganador del 7 vs Ganador del 8
      { bracketId: 12, leg: 'LEG_1', date: '2026-04-09T20:00:00Z', homePh: 'Ganador 7', awayPh: 'Ganador 8' },
      { bracketId: 12, leg: 'LEG_2', date: '2026-04-16T20:00:00Z', homePh: 'Ganador 8', awayPh: 'Ganador 7' },
    ];

    for (const m of QF_MATCHES) {
      await client.query(`
        INSERT INTO matches (
          id, "tournamentId", "homeTeam", "awayTeam",
          "homeTeamPlaceholder", "awayTeamPlaceholder",
          date, status, phase, "homeFlag", "awayFlag",
          "bracketId", "group", stadium, "isManuallyLocked"
        ) VALUES (
          gen_random_uuid(), 'UCL2526', '', '',
          $1, $2,
          $3, 'PENDING', 'QUARTER_FINAL', 'tbd', 'tbd',
          $4, $5, 'TBD', false
        )
      `, [m.homePh, m.awayPh, m.date, m.bracketId, m.leg]);
    }
    console.log(`   ✅ ${QF_MATCHES.length} partidos de Cuartos insertados.`);

    // ========================================================
    // 4. INSERTAR SEMIFINALES
    // ========================================================
    console.log('\n📥 Insertando Semifinales (SEMI_FINAL)...');

    const SF_MATCHES = [
      // Semi bracketId=13: Ganador del Cuarto 9 vs Ganador del Cuarto 10
      { bracketId: 13, leg: 'LEG_1', date: '2026-04-29T20:00:00Z', homePh: 'Ganador 9',  awayPh: 'Ganador 10' },
      { bracketId: 13, leg: 'LEG_2', date: '2026-05-06T20:00:00Z', homePh: 'Ganador 10', awayPh: 'Ganador 9'  },
      // Semi bracketId=14: Ganador del Cuarto 11 vs Ganador del Cuarto 12
      { bracketId: 14, leg: 'LEG_1', date: '2026-04-28T20:00:00Z', homePh: 'Ganador 11', awayPh: 'Ganador 12' },
      { bracketId: 14, leg: 'LEG_2', date: '2026-05-05T20:00:00Z', homePh: 'Ganador 12', awayPh: 'Ganador 11' },
    ];

    for (const m of SF_MATCHES) {
      await client.query(`
        INSERT INTO matches (
          id, "tournamentId", "homeTeam", "awayTeam",
          "homeTeamPlaceholder", "awayTeamPlaceholder",
          date, status, phase, "homeFlag", "awayFlag",
          "bracketId", "group", stadium, "isManuallyLocked"
        ) VALUES (
          gen_random_uuid(), 'UCL2526', '', '',
          $1, $2,
          $3, 'PENDING', 'SEMI_FINAL', 'tbd', 'tbd',
          $4, $5, 'TBD', false
        )
      `, [m.homePh, m.awayPh, m.date, m.bracketId, m.leg]);
    }
    console.log(`   ✅ ${SF_MATCHES.length} partidos de Semis insertados.`);

    // ========================================================
    // 5. INSERTAR FINAL
    // ========================================================
    console.log('\n📥 Insertando Final...');
    await client.query(`
      INSERT INTO matches (
        id, "tournamentId", "homeTeam", "awayTeam",
        "homeTeamPlaceholder", "awayTeamPlaceholder",
        date, status, phase, "homeFlag", "awayFlag",
        "bracketId", stadium, "isManuallyLocked"
      ) VALUES (
        gen_random_uuid(), 'UCL2526', '', '',
        'Ganador 13', 'Ganador 14',
        '2026-05-30T20:00:00Z', 'PENDING', 'FINAL', 'tbd', 'tbd',
        15, 'Puskás Aréna, Budapest', false
      )
    `);
    console.log('   ✅ Final insertada.');

    // ========================================================
    // 6. ENLAZAR nextMatchId (cadena de promoción automática)
    // ========================================================
    console.log('\n🔗 Enlazando nextMatchId...');

    // Obtener IDs de los partidos LEG_1 recién creados
    const qfLeg1 = await client.query(`
      SELECT id, "bracketId" FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL' AND "group" = 'LEG_1'
      ORDER BY "bracketId"
    `);
    const sfLeg1 = await client.query(`
      SELECT id, "bracketId" FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'SEMI_FINAL' AND "group" = 'LEG_1'
      ORDER BY "bracketId"
    `);
    const final = await client.query(`
      SELECT id, "bracketId" FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'FINAL'
    `);

    const qfById = Object.fromEntries(qfLeg1.rows.map(r => [r.bracketId, r.id]));
    const sfById = Object.fromEntries(sfLeg1.rows.map(r => [r.bracketId, r.id]));
    const finalId = final.rows[0]?.id;

    // ROUND_16 bracketIds 1,2 → QF bracketId 9
    // ROUND_16 bracketIds 3,4 → QF bracketId 10
    // ROUND_16 bracketIds 5,6 → QF bracketId 11
    // ROUND_16 bracketIds 7,8 → QF bracketId 12
    const r16ToQF = [
      { r16Ids: [1, 2], qfBracket: 9 },
      { r16Ids: [3, 4], qfBracket: 10 },
      { r16Ids: [5, 6], qfBracket: 11 },
      { r16Ids: [7, 8], qfBracket: 12 },
    ];

    for (const link of r16ToQF) {
      const nextId = qfById[link.qfBracket];
      if (!nextId) { console.warn(`⚠️  No se encontró QF bracketId=${link.qfBracket}`); continue; }
      const result = await client.query(`
        UPDATE matches SET "nextMatchId" = $1
        WHERE "tournamentId" = 'UCL2526'
          AND phase = 'ROUND_16'
          AND "bracketId" = ANY($2::int[])
          AND "group" = 'LEG_1'
        RETURNING "bracketId"
      `, [nextId, link.r16Ids]);
      console.log(`   ✅ R16 bracketIds [${link.r16Ids}] → QF bracketId ${link.qfBracket}: ${result.rowCount} filas actualizadas`);
    }

    // QF → SF
    const qfToSF = [
      { qfIds: [9, 10], sfBracket: 13 },
      { qfIds: [11, 12], sfBracket: 14 },
    ];
    for (const link of qfToSF) {
      const nextId = sfById[link.sfBracket];
      if (!nextId) { console.warn(`⚠️  No se encontró SF bracketId=${link.sfBracket}`); continue; }
      const result = await client.query(`
        UPDATE matches SET "nextMatchId" = $1
        WHERE "tournamentId" = 'UCL2526'
          AND phase = 'QUARTER_FINAL'
          AND "bracketId" = ANY($2::int[])
          AND "group" = 'LEG_1'
        RETURNING "bracketId"
      `, [nextId, link.qfIds]);
      console.log(`   ✅ QF bracketIds [${link.qfIds}] → SF bracketId ${link.sfBracket}: ${result.rowCount} filas actualizadas`);
    }

    // SF → Final
    if (finalId) {
      const result = await client.query(`
        UPDATE matches SET "nextMatchId" = $1
        WHERE "tournamentId" = 'UCL2526'
          AND phase = 'SEMI_FINAL'
          AND "bracketId" = ANY($2::int[])
          AND "group" = 'LEG_1'
        RETURNING "bracketId"
      `, [finalId, [13, 14]]);
      console.log(`   ✅ SF bracketIds [13, 14] → Final: ${result.rowCount} filas actualizadas`);
    }

    // ========================================================
    // 7. VERIFICACIÓN FINAL
    // ========================================================
    const verification = await client.query(`
      SELECT phase, "bracketId", "group", "homeTeamPlaceholder", "awayTeamPlaceholder",
             CASE WHEN "nextMatchId" IS NOT NULL THEN '✅' ELSE '❌' END as linked
      FROM matches
      WHERE "tournamentId" = 'UCL2526'
        AND phase IN ('QUARTER_FINAL', 'SEMI_FINAL', 'FINAL')
      ORDER BY phase, "bracketId", "group"
    `);
    console.log('\n✅ VERIFICACIÓN - Partidos creados:');
    console.table(verification.rows);

    // También verificar que los ROUND_16 quedaron enlazados
    const r16Linked = await client.query(`
      SELECT "bracketId", "group", "homeTeam", "awayTeam",
             CASE WHEN "nextMatchId" IS NOT NULL THEN '✅' ELSE '❌' END as linked
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16'
      ORDER BY "bracketId", "group"
    `);
    console.log('\n✅ VERIFICACIÓN - Octavos con nextMatchId:');
    console.table(r16Linked.rows);

    console.log('\n🎉 ¡Script completado exitosamente!');
    console.log('📌 Ahora ve a la app y recarga la pestaña del torneo para ver los Cuartos de Final.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

run().catch(console.error);
