import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function checkIntegrity() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('--- Inspeccionando DB desde .env ---');

    const leagueCount = await client.query('SELECT COUNT(*) FROM leagues');
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    console.log(`Total Ligas: ${leagueCount.rows[0].count}`);
    console.log(`Total Usuarios: ${userCount.rows[0].count}`);
  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

checkIntegrity();
