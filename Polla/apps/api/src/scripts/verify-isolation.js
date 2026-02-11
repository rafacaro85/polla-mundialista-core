const { Client } = require('pg');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config();

async function verify() {
  const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        ssl: false // Disable SSL for local fallback if needed, or check env
      };

  console.log('🔌 Intentando conectar a:', process.env.DATABASE_URL ? 'Dulce URL' : `${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ CONEXIÓN EXITOSA (Node.js Plain)');

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
    } else {
       console.log('\n⚠️  CONCLUSIÓN: Estado inesperado (Posiblemente 0 partidos de WC?).');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en verificación SQL:', error);
    process.exit(1);
  }
}

verify();
