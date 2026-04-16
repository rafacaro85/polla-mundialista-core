const { Client } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL;

const SEMI_MATCHES = [
  // Ida
  {
    date: '2026-04-28T19:00:00Z', 
    homeTeam: 'PSG',
    awayTeam: 'Bayern Munich',
    homeFlag: 'https://crests.football-data.org/524.svg',
    awayFlag: 'https://crests.football-data.org/5.svg',
    group: 'LEG_1', 
    bracketId: 101,
  },
  {
    date: '2026-04-29T19:00:00Z', 
    homeTeam: 'Atletico Madrid',
    awayTeam: 'Arsenal',
    homeFlag: 'https://crests.football-data.org/78.svg',
    awayFlag: 'https://crests.football-data.org/57.svg',
    group: 'LEG_1', 
    bracketId: 102,
  },
  // Vuelta
  {
    date: '2026-05-05T19:00:00Z', 
    homeTeam: 'Arsenal',
    awayTeam: 'Atletico Madrid',
    homeFlag: 'https://crests.football-data.org/57.svg',
    awayFlag: 'https://crests.football-data.org/78.svg',
    group: 'LEG_2', 
    bracketId: 102,
  },
  {
    date: '2026-05-06T19:00:00Z', 
    homeTeam: 'Bayern Munich',
    awayTeam: 'PSG',
    homeFlag: 'https://crests.football-data.org/5.svg',
    awayFlag: 'https://crests.football-data.org/524.svg',
    group: 'LEG_2', 
    bracketId: 101,
  }
];

async function seed() {
  console.log('Conectando a la base de datos...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conexión establecida.');

    const tournamentId = 'UCL2526';
    const currentPhase = 'SEMI';

    // 1. Asegurar que QUARTER está completada y desbloqueada
    await client.query(`
      INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, all_matches_completed)
      VALUES ('QUARTER', $1, true, true)
      ON CONFLICT (phase, "tournamentId") 
      DO UPDATE SET is_unlocked = true, all_matches_completed = true
    `, [tournamentId]);
    console.log('🔓 Cuartos de Final (QUARTER) actualizados a completados.');

    // 2. Asegurar que SEMI está desbloqueada
    await client.query(`
      INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, all_matches_completed, unlocked_at)
      VALUES ('SEMI', $1, true, false, NOW())
      ON CONFLICT (phase, "tournamentId") 
      DO UPDATE SET is_unlocked = true, all_matches_completed = false
    `, [tournamentId]);
    console.log('🔓 Semifinales (SEMI) desbloqueadas exitosamente.');

    // 3. Insertar los partidos
    console.log('⚽ Verificando / Insertando partidos de Semifinales...');
    let inserted = 0;

    for (const match of SEMI_MATCHES) {
      const res = await client.query(`
        SELECT id FROM match 
        WHERE "homeTeam" = $1 AND "awayTeam" = $2 AND phase = $3 AND "tournamentId" = $4
      `, [match.homeTeam, match.awayTeam, currentPhase, tournamentId]);

      if (res.rowCount === 0) {
        await client.query(`
          INSERT INTO match (
            "homeTeam", "awayTeam", "homeFlag", "awayFlag", 
            date, "group", phase, "bracketId", "tournamentId", status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'SCHEDULED')
        `, [
          match.homeTeam, match.awayTeam, match.homeFlag, match.awayFlag,
          new Date(match.date), match.group, currentPhase, match.bracketId, tournamentId
        ]);
        inserted++;
        console.log(`   (+) Añadido: ${match.homeTeam} vs ${match.awayTeam}`);
      } else {
        console.log(`   (=) Ya existe: ${match.homeTeam} vs ${match.awayTeam}`);
      }
    }

    console.log(`\n🎉 ¡Listo! Fases arregladas y ${inserted} partidos inyectados.`);
  } catch (err) {
    console.error('❌ Error fatal:', err);
  } finally {
    await client.end();
  }
}

seed();
