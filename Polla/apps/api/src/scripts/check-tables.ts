import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkTables() {
  const client = new Client({
    connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('--- Verificando Tablas Críticas ---');

    const tables = ['league_prizes', 'league_banners', 'leagues', 'league_participants'];
    for (const table of tables) {
      const res = await client.query(`
        SELECT count(*) FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = $1
      `, [table]);
      const exists = parseInt(res.rows[0].count) > 0;
      console.log(`Tabla ${table}: ${exists ? '✅ EXISTE' : '❌ NO EXISTE'}`);
    }

    console.log('--- Listando Ligas Recientes ---');
    const allLeaguesRes = await client.query('SELECT id, name, status FROM leagues ORDER BY id LIMIT 10');
    allLeaguesRes.rows.forEach(l => {
        console.log(`Liga: ${l.id} - ${l.name} (${l.status})`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

checkTables();
