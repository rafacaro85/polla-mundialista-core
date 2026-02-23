import { Client } from 'pg';

async function run() {
  const connectionString = 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('--- Inspeccionando Liga y Creador ---');
    
    const leagueId = '4b5f5caf-4f5c-49e6-9800-409f29081a46';
    const res = await client.query('SELECT id, name, creator_id, status FROM leagues WHERE id = $1', [leagueId]);

    if (res.rows.length > 0) {
      const league = res.rows[0];
      console.log('✅ Liga encontrada:', league);
      
      if (league.creator_id) {
          const userRes = await client.query('SELECT id, email, nickname, "fullName" FROM users WHERE id = $1', [league.creator_id]);
          if (userRes.rows.length > 0) {
              console.log('✅ Creador encontrado:', userRes.rows[0]);
          } else {
              console.log('❌ Creador NO encontrado en la tabla users.');
          }
      } else {
          console.log('❌ La liga no tiene creator_id.');
      }
    } else {
      console.log('❌ Liga NO encontrada.');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

run();
