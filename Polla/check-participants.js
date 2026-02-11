
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function checkParticipants() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'polla_db',
  });

  try {
    await client.connect();
    const userId = '05d10c1f-54fc-4a40-8aae-339d89ef0ebf';
    const res = await client.query('SELECT * FROM league_participants WHERE user_id = $1', [userId]);
    console.log(`Found ${res.rows.length} participations for user ${userId}`);
    res.rows.forEach(r => {
        console.log(`League ID: ${r.league_id}, Admin: ${r.isAdmin}`);
    });

    if (res.rows.length > 0) {
        const leagueIds = res.rows.map(r => r.league_id);
        const lRes = await client.query('SELECT id, name, "tournamentId" FROM leagues WHERE id = ANY($1)', [leagueIds]);
        console.log('\nLeagues details:');
        console.log(lRes.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

checkParticipants();
