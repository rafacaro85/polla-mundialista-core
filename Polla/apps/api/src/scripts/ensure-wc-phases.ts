import { DataSource } from 'typeorm';

async function fixPhases() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await ds.initialize();
    console.log('Connected to DB');

    const tournamentId = 'WC2026';
    const phases = [
      'GROUP',
      'ROUND_32',
      'ROUND_16',
      'QUARTER',
      'SEMI',
      '3RD_PLACE',
      'FINAL',
    ];

    for (const phase of phases) {
      console.log(`Ensuring phase: ${phase}`);
      await ds.query(
        `
        INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, all_matches_completed)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (phase, "tournamentId") 
        DO UPDATE SET 
          is_unlocked = EXCLUDED.is_unlocked,
          all_matches_completed = EXCLUDED.all_matches_completed
      `,
        [phase, tournamentId, phase === 'GROUP', false],
      );
    }

    console.log('✅ All WC2026 phases updated/inserted');

    // Check results
    const results = await ds.query(
      'SELECT phase, is_unlocked FROM knockout_phase_status WHERE "tournamentId" = $1 ORDER BY id',
      [tournamentId],
    );
    console.log(results);
  } catch (e) {
    console.error(e);
  } finally {
    await ds.destroy();
  }
}

fixPhases();
