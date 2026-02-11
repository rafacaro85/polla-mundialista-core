
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });

async function debugLeagues() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'polla_db',
  });

  try {
    await client.connect();
    console.log('--- USERS ---');
    const users = await client.query('SELECT id, email, nickname FROM users WHERE email = $1', ['admin@admin.com']);
    console.log(users.rows);

    if (users.rows.length > 0) {
      const adminId = users.rows[0].id;
      console.log(`\n--- LEAGUES FOR ${adminId} ---`);
      const leagues = await client.query(`
        SELECT l.id, l.name, l."tournamentId", l.is_paid, lp."isAdmin"
        FROM leagues l
        JOIN league_participants lp ON lp."leagueId" = l.id
        WHERE lp."userId" = $1
      `, [adminId]);
      console.log(leagues.rows);
      
      console.log('\n--- ALL LEAGUES (Summary) ---');
      const allLeagues = await client.query('SELECT name, "tournamentId", is_paid FROM leagues ORDER BY created_at DESC LIMIT 5');
      console.log(allLeagues.rows);

      console.log('\n--- TRANSACTIONS (Summary) ---');
      const txs = await client.query('SELECT "leagueId", "tournamentId", status FROM transactions ORDER BY created_at DESC LIMIT 5');
      console.log(txs.rows);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugLeagues();
