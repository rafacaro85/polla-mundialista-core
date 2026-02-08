import { DataSource } from 'typeorm';

async function diagnoseReset() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await ds.initialize();
    console.log('✅ Connected to DB');

    console.log('--- TABLE INTROSPECTION ---');
    const lpCols = await ds.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'league_participants'");
    console.log('league_participants columns:');
    console.table(lpCols);

    const pCols = await ds.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'predictions'");
    console.log('predictions columns:');
    console.table(pCols);

    const ubCols = await ds.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'user_brackets'");
    console.log('user_brackets columns:');
    console.table(ubCols);

    const kpsCols = await ds.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'knockout_phase_status'");
    console.log('knockout_phase_status columns:');
    console.table(kpsCols);
    console.log('---------------------------');

    const tid = 'WC2026'; // Simulando el reset para el Mundial
    console.log(`🧹 [DIAGNOSE] Testing reset for: ${tid}`);

    // Step 1: Update matches score and status
    console.log('Step 1: Updating matches...');
    const result1 = await ds.query(`
      UPDATE matches 
      SET "homeScore" = NULL, "awayScore" = NULL, status = 'PENDING', "isManuallyLocked" = false
      WHERE "tournamentId" = $1
    `, [tid]);
    console.log('✅ Matches updated:', result1);

    // Step 2: Clearing placeholders
    console.log('Step 2: Clearing placeholders...');
    const result2 = await ds.query(`
      UPDATE matches
      SET "homeTeam" = '', "awayTeam" = '', "homeFlag" = NULL, "awayFlag" = NULL
      WHERE "phase" != 'GROUP' AND "phase" != 'PLAYOFF' 
      AND ("homeTeamPlaceholder" IS NOT NULL OR "awayTeamPlaceholder" IS NOT NULL)
      AND "tournamentId" = $1
    `, [tid]);
    console.log('✅ Placeholders cleared:', result2);

    // Step 3: Reset predictions
    console.log('Step 3: Resetting predictions...');
    const result3 = await ds.query(`
      UPDATE predictions SET "points" = 0 WHERE "tournamentId" = $1
    `, [tid]);
    console.log('✅ Predictions reset:', result3);

    // Step 4: Reset bracket points
    console.log('Step 4: Resetting bracket points...');
    const result4 = await ds.query(`
      UPDATE user_brackets SET "points" = 0 WHERE "tournamentId" = $1
    `, [tid]);
    console.log('✅ Brackets reset:', result4);

    // Step 5: Reset phases (correcting table and column names)
    console.log('Step 5: Resetting phases...');
    const result5 = await ds.query(`
      UPDATE knockout_phase_status 
      SET is_unlocked = false, all_matches_completed = false, unlocked_at = NULL
      WHERE "tournamentId" = $1
    `, [tid]);
    console.log('✅ Phases reset:', result5);

    // Step 6: Unlock initial phase
    console.log('Step 6: Unlocking initial phase...');
    const result6 = await ds.query(`
      UPDATE knockout_phase_status SET is_unlocked = true 
      WHERE phase = 'GROUP' AND "tournamentId" = $1
    `, [tid]);
    console.log('✅ Initial phase unlocked:', result6);

    // Step 7: Recalculate participant points
    console.log('Step 7: Recalculating participant points...');
    try {
        // Predictions: league_id is varchar, lp.league_id is int. userId is uuid, user_id is uuid.
        await ds.query(`
          UPDATE league_participants lp 
          SET prediction_points = (
              SELECT COALESCE(SUM(p.points), 0) 
              FROM predictions p 
              WHERE p.league_id::text = lp.league_id::text AND p."userId" = lp.user_id
          )
        `);
        console.log('✅ Prediction points recalculated');
    } catch (e) {
        console.error('❌ Step 7a failed (predictions):', e);
    }

    try {
        // Brackets: leagueId (capital I) is int, lp.league_id is int. userId is uuid, user_id is uuid.
        await ds.query(`
          UPDATE league_participants lp 
          SET bracket_points = (
              SELECT COALESCE(SUM(ub.points), 0) 
              FROM user_brackets ub 
              WHERE ub."leagueId" = lp.league_id AND ub."userId" = lp.user_id
          )
        `);
        console.log('✅ Bracket points recalculated');
    } catch (e) {
        console.error('❌ Step 7b failed (brackets):', e);
    }

    await ds.query(`
      UPDATE league_participants 
      SET total_points = COALESCE(prediction_points, 0) + COALESCE(bracket_points, 0) + COALESCE(trivia_points, 0) + COALESCE(joker_points, 0)
    `);
    console.log('✅ Total points updated');

  } catch (e) {
    console.error('❌ DIAGNOSE FAILED:');
    console.error(e);
  } finally {
    await ds.destroy();
  }
}

diagnoseReset();
