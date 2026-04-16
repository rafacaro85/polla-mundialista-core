const { Client } = require('pg');

const DATABASE_URL = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@66.33.22.244:13451/railway";

async function fix() {
  console.log('Conectando a la base de datos para la purga final de llaves duplicadas...');
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado.');

    // 1. ELIMINAR los partidos manuales ("is null" en placeholder o bracket_id inventados 101/102)
    const delRes = await client.query(`
      DELETE FROM matches 
      WHERE "tournamentId" = 'UCL2526' 
      AND phase = 'SEMI' 
      AND "homeTeamPlaceholder" IS NULL
    `);
    console.log(`🧹 Eliminados ${delRes.rowCount} partidos duplicados flotantes.`);

    // 2. RENOMBRAR las fases de las llaves orgánicas para que empaten con el FrontEnd
    await client.query(`UPDATE knockout_phase_status SET phase = 'QUARTER' WHERE phase = 'QUARTER_FINAL' AND "tournamentId" = 'UCL2526'`);
    await client.query(`UPDATE knockout_phase_status SET phase = 'SEMI' WHERE phase = 'SEMI_FINAL' AND "tournamentId" = 'UCL2526'`);
    
    await client.query(`UPDATE matches SET phase = 'QUARTER' WHERE phase = 'QUARTER_FINAL' AND "tournamentId" = 'UCL2526'`);
    await client.query(`UPDATE matches SET phase = 'SEMI' WHERE phase = 'SEMI_FINAL' AND "tournamentId" = 'UCL2526'`);
    
    console.log(`🏷️ Fases renombradas con éxito. (QUARTER_FINAL -> QUARTER, SEMI_FINAL -> SEMI)`);

    // 3. ACTUALIZAR los partidos orgánicos (bracket 13 y 14) con los equipos correctos y la FECHA/HORA corregida (19:00:00 puras de Postgres)
    console.log('⏰ Inyectando equipos y horarios correctos (2:00 PM Colombia) en las llaves originales...');
    
    const queries = [
      // Bracket 13 - IDA
      `UPDATE matches SET "homeTeam" = 'PSG', "awayTeam" = 'Bayern Munich', "homeFlag" = 'https://media.api-sports.io/football/teams/85.png', "awayFlag" = 'https://media.api-sports.io/football/teams/157.png', date = '2026-04-28 19:00:00' WHERE "tournamentId" = 'UCL2526' AND phase = 'SEMI' AND "group" = 'LEG_1' AND "bracketId" = 13`,
      // Bracket 14 - IDA
      `UPDATE matches SET "homeTeam" = 'Atletico Madrid', "awayTeam" = 'Arsenal', "homeFlag" = 'https://media.api-sports.io/football/teams/530.png', "awayFlag" = 'https://media.api-sports.io/football/teams/42.png', date = '2026-04-29 19:00:00' WHERE "tournamentId" = 'UCL2526' AND phase = 'SEMI' AND "group" = 'LEG_1' AND "bracketId" = 14`,
      
      // Bracket 13 - VUELTA
      `UPDATE matches SET "homeTeam" = 'Bayern Munich', "awayTeam" = 'PSG', "homeFlag" = 'https://media.api-sports.io/football/teams/157.png', "awayFlag" = 'https://media.api-sports.io/football/teams/85.png', date = '2026-05-06 19:00:00' WHERE "tournamentId" = 'UCL2526' AND phase = 'SEMI' AND "group" = 'LEG_2' AND "bracketId" = 13`,
      // Bracket 14 - VUELTA
      `UPDATE matches SET "homeTeam" = 'Arsenal', "awayTeam" = 'Atletico Madrid', "homeFlag" = 'https://media.api-sports.io/football/teams/42.png', "awayFlag" = 'https://media.api-sports.io/football/teams/530.png', date = '2026-05-05 19:00:00' WHERE "tournamentId" = 'UCL2526' AND phase = 'SEMI' AND "group" = 'LEG_2' AND "bracketId" = 14`,
    ];

    for (const q of queries) {
      await client.query(q);
    }

    console.log('🎉 ¡Todas las llaves mapeadas al árbol oficial e integradas perfectamente!');

  } catch (err) {
    console.error('❌ Error fatal:', err);
  } finally {
    await client.end();
  }
}

fix();
