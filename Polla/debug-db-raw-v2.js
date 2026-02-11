
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
    
    const users = await client.query('SELECT id, email FROM users WHERE email = $1', ['admin@admin.com']);
    console.log('User:', users.rows[0]);

    const leagues = await client.query('SELECT * FROM leagues');
    console.log('\n--- ALL LEAGUES ---');
    leagues.rows.forEach(l => {
        console.log(`ID: ${l.id}, Name: ${l.name}, Tournament: ${l.tournamentId || l.tournamentid}, Paid: ${l.is_paid ?? l.isPaid}`);
    });

    const participants = await client.query('SELECT * FROM league_participants');
    console.log('\n--- PARTICIPANTS ---');
    participants.rows.forEach(p => {
        console.log(`User: ${p.userId || p.userid}, League: ${p.leagueId || p.leagueid}, Admin: ${p.isAdmin || p.isadmin}`);
    });

    const txs = await client.query('SELECT * FROM transactions');
    console.log('\n--- TRANSACTIONS ---');
    txs.rows.forEach(t => {
        console.log(`League: ${t.leagueId || t.leagueid}, Tournament: ${t.tournamentId || t.tournamentid}, Status: ${t.status}`);
    });

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugLeagues();
