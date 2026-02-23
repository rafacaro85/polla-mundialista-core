import { Client } from 'pg';

async function run() {
  const connectionString =
    'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('--- Probando GET League ---');

    const leagueId = 'ac6b7be9-d19a-4bd5-948b-1ae59c67696e';
    const res = await client.query('SELECT * FROM leagues WHERE id = $1', [
      leagueId,
    ]);

    if (res.rows.length > 0) {
      console.log('✅ Liga encontrada en DB:', res.rows[0]);
    } else {
      console.log('❌ Liga NO encontrada en DB.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
