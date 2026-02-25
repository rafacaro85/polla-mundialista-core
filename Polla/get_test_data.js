const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();

  console.log('--- BUSCANDO USUARIO ---');
  const userRes = await client.query('SELECT id, email, "full_name" as "fullName" FROM users LIMIT 1');
  if (userRes.rows.length > 0) {
    console.log('User:', userRes.rows[0]);
  }

  console.log('\n--- BUSCANDO PARTIDO FUTURO ---');
  // Usando comillas para columnas que TypeORM crea con CamelCase
  const matchRes = await client.query('SELECT id, "homeTeam", "awayTeam", date, phase, "tournamentId" FROM matches WHERE date > NOW() AND "status" != \'FINISHED\' LIMIT 1');
  if (matchRes.rows.length > 0) {
    console.log('Match:', matchRes.rows[0]);
  }

  await client.end();
}
run().catch(console.error);
