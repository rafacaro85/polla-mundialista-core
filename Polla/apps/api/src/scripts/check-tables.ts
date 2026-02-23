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
    console.log('--- Transacciones de Ligas ---');

    const res = await client.query('SELECT id, status, league_id, user_id FROM transactions WHERE league_id IS NOT NULL');
    if (res.rows.length === 0) {
        console.log('No hay transacciones asociadas a ligas.');
    } else {
        res.rows.forEach(r => {
            console.log(`TX: ${r.id} | S: ${r.status} | L: ${r.league_id} | U: ${r.user_id}`);
        });
    }

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

checkTables();
