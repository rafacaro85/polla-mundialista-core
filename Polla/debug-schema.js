
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function debugSchemaIndepth() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'polla_db',
  });

  try {
    await client.connect();
    
    console.log('--- LEAGUES TABLE ---');
    const l_res = await client.query('SELECT * FROM leagues LIMIT 1');
    if (l_res.rows.length > 0) console.log(Object.keys(l_res.rows[0]));

    console.log('\n--- PARTICIPANTS TABLE ---');
    const p_res = await client.query('SELECT * FROM league_participants LIMIT 1');
    if (p_res.rows.length > 0) console.log(Object.keys(p_res.rows[0]));

    console.log('\n--- TRANSACTIONS TABLE ---');
    const t_res = await client.query('SELECT * FROM transactions LIMIT 1');
    if (t_res.rows.length > 0) console.log(Object.keys(t_res.rows[0]));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugSchemaIndepth();
