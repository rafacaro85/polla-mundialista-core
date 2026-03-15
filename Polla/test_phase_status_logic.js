/**
 * test_phase_status_logic.js
 * 
 * Prueba la lógica exacta que usa MatchesService.getAllPhaseStatus
 * para ver si falla con un error 500 en el servidor.
 */

const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  console.log('✅ Conectado a la BD\n');

  try {
    const tournamentId = 'WC2026';
    console.log(`🔍 Probando lógica para tournamentId: ${tournamentId}`);

    // 1. Simular la consulta de TypeORM
    // La entidad tiene Column(name: "is_unlocked") property isUnlocked
    // TypeORM genera: SELECT phase, is_unlocked as "isUnlocked", ... FROM knockout_phase_status
    const query = `
      SELECT 
        phase, 
        is_unlocked as "isUnlocked", 
        all_matches_completed as "allMatchesCompleted",
        is_manually_locked as "isManuallyLocked"
      FROM knockout_phase_status
      WHERE "tournamentId" = $1
    `;
    
    const res = await client.query(query, [tournamentId]);
    console.log(`✅ Consulta exitosa. Encontrados ${res.rows.length} registros.`);
    
    // 2. Simular el mapeo del servicio
    const phases = ['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', '3RD_PLACE', 'FINAL'];
    const statusMap = new Map(res.rows.map(s => [s.phase, s]));

    const result = phases.map(phase => {
        const status = statusMap.get(phase);
        return {
            phase,
            isManuallyLocked: status?.isManuallyLocked || false,
            isUnlocked: status?.isUnlocked || false,
            allMatchesCompleted: status?.allMatchesCompleted || false,
            tournamentId
        };
    });

    console.log('📦 Resultado del mapeo:');
    console.table(result);

    console.log('\n🚀 La lógica de datos es CORRECTA. El error 500 debe ser por otra cosa.');

  } catch (e) {
    console.error('❌ ERROR en la lógica:', e.message);
    if (e.message.includes('column')) {
        console.log('💡 Posible error de nombres de columna en el código vs base de datos.');
    }
  } finally {
    await client.end();
  }
}

run().catch(console.error);
