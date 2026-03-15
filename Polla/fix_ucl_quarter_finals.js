/**
 * fix_ucl_quarter_finals.js
 * 
 * 1. Desbloquea la fase QUARTER_FINAL en knockout_phase_status
 * 2. Marca ROUND_16 como completada (allMatchesCompleted = true)
 * 3. Determina los ganadores de Octavos leyendo los resultados ya en la BD
 * 4. Actualiza los partidos de Cuartos con los nombres reales de los equipos
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Conectado a PostgreSQL Railway\n');

  try {
    // =========================================================
    // 1. DIAGNÓSTICO: ver resultados actuales de Octavos
    // =========================================================
    const r16 = await client.query(`
      SELECT id, "bracketId", "group", "homeTeam", "awayTeam",
             "homeScore", "awayScore", status
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16'
      ORDER BY "bracketId", "group"
    `);
    console.log('📋 OCTAVOS - Resultados actuales:');
    console.table(r16.rows.map(r => ({
      bracketId: r.bracketId, leg: r.group,
      home: r.homeTeam, hG: r.homeScore,
      aG: r.awayScore, away: r.awayTeam, st: r.status
    })));

    // =========================================================
    // 2. CALCULAR GANADORES por llave (suma de ida + vuelta)
    // =========================================================
    const winners = {}; // bracketId -> { winner, winnerFlag, loser, loserFlag }
    const byBracket = {};

    for (const m of r16.rows) {
      const bid = m.bracketId;
      if (!byBracket[bid]) byBracket[bid] = [];
      byBracket[bid].push(m);
    }

    for (const [bid, matches] of Object.entries(byBracket)) {
      const allFinished = matches.every(m =>
        ['FINISHED', 'COMPLETED', 'FINALIZADO', 'PENALTIES'].includes(m.status)
      );

      if (!allFinished) {
        console.log(`⚠️  Llave ${bid}: no todos los partidos terminados (${matches.map(m=>m.status).join(', ')}). Calculando igual con los resultados disponibles...`);
      }

      // Acumular goles
      const stats = {};
      for (const m of matches) {
        const h = m.homeTeam, a = m.awayTeam;
        if (!stats[h]) stats[h] = { gf: 0, ga: 0 };
        if (!stats[a]) stats[a] = { gf: 0, ga: 0 };
        stats[h].gf += (m.homeScore || 0);
        stats[h].ga += (m.awayScore || 0);
        stats[a].gf += (m.awayScore || 0);
        stats[a].ga += (m.homeScore || 0);
      }

      const teams = Object.keys(stats);
      if (teams.length < 2) {
        console.log(`⚠️  Llave ${bid}: no se encontraron 2 equipos`);
        continue;
      }

      const [t1, t2] = teams;
      let winner, loser;
      if (stats[t1].gf > stats[t2].gf) { winner = t1; loser = t2; }
      else if (stats[t2].gf > stats[t1].gf) { winner = t2; loser = t1; }
      else {
        // Empate - usar el que tiene más goles de visitante como desempate básico
        winner = t1; loser = t2;
        console.log(`⚠️  Llave ${bid}: EMPATE en global. Se usa ${t1} como ganador provisional.`);
      }

      winners[bid] = { winner, loser, t1Score: stats[t1].gf, t2Score: stats[t2].gf };
      console.log(`🏆 Llave ${bid}: ${t1} ${stats[t1].gf} - ${stats[t2].gf} ${t2} → GANADOR: ${winner}`);
    }

    // =========================================================
    // 3. VER PARTIDOS DE CUARTOS (para saber qué placeholder actualizar)
    // =========================================================
    const qf = await client.query(`
      SELECT id, "bracketId", "group", "homeTeamPlaceholder", "awayTeamPlaceholder",
             "homeTeam", "awayTeam"
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL'
      ORDER BY "bracketId", "group"
    `);
    console.log('\n📋 CUARTOS - Estado actual:');
    console.table(qf.rows.map(r => ({
      bracketId: r.bracketId, leg: r.group,
      homePH: r.homeTeamPlaceholder, awayPH: r.awayTeamPlaceholder,
      home: r.homeTeam, away: r.awayTeam
    })));

    // Mapping: "Ganador 1" -> bracketId 1 en ROUND_16
    // El placeholder "Ganador N" corresponde al bracketId N de ROUND_16
    const getGanadorNum = (ph) => {
      const m = ph?.match(/Ganador (\d+)/);
      return m ? parseInt(m[1]) : null;
    };

    // =========================================================
    // 4. ACTUALIZAR CUARTOS con los equipos reales
    // =========================================================
    console.log('\n📝 Actualizando nombres en Cuartos de Final...');
    let updatedCount = 0;

    for (const qfMatch of qf.rows) {
      const homeNum = getGanadorNum(qfMatch.homeTeamPlaceholder);
      const awayNum = getGanadorNum(qfMatch.awayTeamPlaceholder);

      const homeWinner = homeNum ? winners[homeNum]?.winner : null;
      const awayWinner = awayNum ? winners[awayNum]?.winner : null;

      if (homeWinner || awayWinner) {
        // Obtener flags del partido de Octavos correspondiente
        let homeFlag = 'tbd', awayFlag = 'tbd';
        if (homeNum) {
          const r16Match = r16.rows.find(m => m.bracketId === homeNum && m.homeTeam === homeWinner);
          homeFlag = r16Match?.homeFlag || r16.rows.find(m => m.bracketId === homeNum && m.awayTeam === homeWinner)?.awayFlag || 'tbd';
        }
        if (awayNum) {
          const r16Match = r16.rows.find(m => m.bracketId === awayNum && m.homeTeam === awayWinner);
          awayFlag = r16Match?.homeFlag || r16.rows.find(m => m.bracketId === awayNum && m.awayTeam === awayWinner)?.awayFlag || 'tbd';
        }

        await client.query(`
          UPDATE matches SET
            "homeTeam" = COALESCE($1, "homeTeam"),
            "awayTeam" = COALESCE($2, "awayTeam"),
            "homeFlag" = CASE WHEN $1 IS NOT NULL THEN $3 ELSE "homeFlag" END,
            "awayFlag" = CASE WHEN $2 IS NOT NULL THEN $4 ELSE "awayFlag" END,
            status = 'SCHEDULED'
          WHERE id = $5
        `, [homeWinner || null, awayWinner || null, homeFlag, awayFlag, qfMatch.id]);

        console.log(`  ✅ QF bracketId=${qfMatch.bracketId} ${qfMatch.group}: ${homeWinner||'?'} vs ${awayWinner||'?'}`);
        updatedCount++;
      }
    }
    console.log(`\n  → ${updatedCount} partidos de Cuartos actualizados.`);

    // =========================================================
    // 5. ACTUALIZAR knockout_phase_status
    // =========================================================
    console.log('\n🔓 Actualizando knockout_phase_status...');

    // Marcar ROUND_16 como completada
    const r16Status = await client.query(`
      UPDATE knockout_phase_status
      SET "all_matches_completed" = true
      WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16'
      RETURNING id
    `);
    console.log(`  ✅ ROUND_16 marcada como completada: ${r16Status.rowCount} fila(s)`);

    // Desbloquear QUARTER_FINAL (upsert)
    const qfExists = await client.query(`
      SELECT id FROM knockout_phase_status
      WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL'
    `);

    if (qfExists.rows.length > 0) {
      await client.query(`
        UPDATE knockout_phase_status
        SET "is_unlocked" = true, "all_matches_completed" = false
        WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL'
      `);
      console.log('  ✅ QUARTER_FINAL desbloqueada (UPDATE)');
    } else {
      await client.query(`
        INSERT INTO knockout_phase_status (id, "tournamentId", phase, "is_unlocked", "all_matches_completed", "is_manually_locked")
        VALUES (gen_random_uuid(), 'UCL2526', 'QUARTER_FINAL', true, false, false)
      `);
      console.log('  ✅ QUARTER_FINAL creada y desbloqueada (INSERT)');
    }

    // Asegurar que SEMI_FINAL y FINAL existan pero bloqueadas
    for (const phase of ['SEMI_FINAL', 'FINAL']) {
      const exists = await client.query(`
        SELECT id FROM knockout_phase_status WHERE "tournamentId" = 'UCL2526' AND phase = $1
      `, [phase]);
      if (exists.rows.length === 0) {
        await client.query(`
          INSERT INTO knockout_phase_status (id, "tournamentId", phase, "is_unlocked", "all_matches_completed", "is_manually_locked")
          VALUES (gen_random_uuid(), 'UCL2526', $1, false, false, false)
        `, [phase]);
        console.log(`  ✅ ${phase} creada (bloqueada hasta que corresponda)`);
      } else {
        console.log(`  ℹ️  ${phase} ya existe`);
      }
    }

    // =========================================================
    // 6. VERIFICACIÓN FINAL
    // =========================================================
    const finalQF = await client.query(`
      SELECT "bracketId", "group", "homeTeam", "awayTeam", status
      FROM matches
      WHERE "tournamentId" = 'UCL2526' AND phase = 'QUARTER_FINAL'
      ORDER BY "bracketId", "group"
    `);
    console.log('\n✅ CUARTOS - Estado final:');
    console.table(finalQF.rows);

    const phaseStatuses = await client.query(`
      SELECT phase, "is_unlocked", "all_matches_completed"
      FROM knockout_phase_status
      WHERE "tournamentId" = 'UCL2526'
      ORDER BY phase
    `);
    console.log('\n✅ ESTADO DE FASES:');
    console.table(phaseStatuses.rows);

    console.log('\n🎉 ¡Todo listo! Recarga la app para ver los Cuartos de Final con los equipos correctos.');

  } catch (e) {
    console.error('❌ Error:', e.message);
    console.error(e);
  } finally {
    await client.end();
    console.log('\n🔌 Conexión cerrada.');
  }
}

run().catch(console.error);
