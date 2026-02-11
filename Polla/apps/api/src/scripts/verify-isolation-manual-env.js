const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
try {
  const envPath = path.resolve(process.cwd(), '.env');
  console.log('📖 Leyendo .env desde:', envPath);
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^['"]|['"]$/g, ''); // Remove quotes
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    });
    console.log('✅ Variables de entorno cargadas manualmente.');
  } else {
    console.warn('⚠️  No se encontró el archivo .env');
  }
} catch (e) {
  console.error('❌ Error leyendo .env:', e);
}

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

async function verify() {
  const dbConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL, ssl: false }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        ssl: false
      };
      
  // Log the host to be sure (masked)
  console.log('🔌 Conectando a BD en host:', dbConfig.host || 'URL');

  const client = new Client(dbConfig);

  try {
    await client.connect();
    console.log('✅ CONEXIÓN EXITOSA (Node.js Manual Env)');

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
      console.log('\n⚠️  CONCLUSIÓN: Champions aún no inyectada (0 partidos de UCL).');
    } else {
       console.log('\n⚠️  CONCLUSIÓN: Estado inesperado.');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en verificación SQL:', error);
    process.exit(1);
  }
}

verify();
