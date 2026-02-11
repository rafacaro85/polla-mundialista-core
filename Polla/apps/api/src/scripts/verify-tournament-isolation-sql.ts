import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function verify() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('🔍 VERIFICACIÓN SQL DIRECTA (Bypass TypeORM)...');

    // Count WC2026 Matches
    const wcRes = await client.query(`SELECT COUNT(*) FROM matches WHERE "tournamentId" = 'WC2026'`);
    const wcCount = parseInt(wcRes.rows[0].count, 10);

    // Count UCL2526 Matches
    const uclRes = await client.query(`SELECT COUNT(*) FROM matches WHERE "tournamentId" = 'UCL2526'`);
    const uclCount = parseInt(uclRes.rows[0].count, 10);

    // Check for anomalies
    const anomalyRes = await client.query(`SELECT COUNT(*) FROM matches WHERE "tournamentId" NOT IN ('WC2026', 'UCL2526')`);
    const anomalies = parseInt(anomalyRes.rows[0].count, 10);

    console.log('\n📊 REPORTE DE ESTADO:');
    console.log('---------------------');
    console.log(`🏆 Mundial 2026 (WC2026):      ${wcCount} partidos`);
    console.log(`🇪🇺 Champions (UCL2526):       ${uclCount} partidos`);
    console.log('---------------------');

    if (anomalies > 0) {
      console.error(`⚠️  ALERTA: Se encontraron ${anomalies} partidos con IDs desconocidos!`);
    } else {
      console.log('✅ Integridad de IDs: PERFECTA (0 anomalías)');
    }

    if (wcCount > 0 && uclCount > 0) {
      console.log('\n✅ CONCLUSIÓN: Coexistencia Exitosa. Los torneos están aislados.');
    } else if (uclCount === 0) {
      console.log('\n⚠️  CONCLUSIÓN: Champions aún no inyectada.');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en verificación SQL:', error);
    process.exit(1);
  }
}

verify();
