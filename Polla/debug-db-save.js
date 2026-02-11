
const { Client } = require('pg');
require('dotenv').config({ path: 'apps/api/.env' });
const fs = require('fs');

async function debugLeagues() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    user: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'polla_db',
  });

  let output = '';

  try {
    await client.connect();
    
    const users = await client.query('SELECT id, email FROM users WHERE email = $1', ['admin@admin.com']);
    output += `User: ${JSON.stringify(users.rows[0])}\n`;

    const leagues = await client.query('SELECT * FROM leagues');
    output += '\n--- ALL LEAGUES ---\n';
    leagues.rows.forEach(l => {
        output += `ID: ${l.id}, Name: ${l.name}, Tournament: ${l.tournamentId || l.tournamentid}, Paid: ${l.is_paid ?? l.isPaid}, Enterprise: ${l.is_enterprise ?? l.isEnterprise}\n`;
    });

    const participants = await client.query('SELECT * FROM league_participants');
    output += '\n--- PARTICIPANTS ---\n';
    participants.rows.forEach(p => {
        output += `User: ${p.userId || p.userid}, League: ${p.leagueId || p.leagueid}, Admin: ${p.isAdmin || p.isadmin}\n`;
    });

    const txs = await client.query('SELECT * FROM transactions');
    output += '\n--- TRANSACTIONS ---\n';
    txs.rows.forEach(t => {
        output += `League: ${t.leagueId || t.leagueid}, Tournament: ${t.tournamentId || t.tournamentid}, Status: ${t.status}\n`;
    });

    fs.writeFileSync('debug_output.txt', output);
    console.log('Output written to debug_output.txt');

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

debugLeagues();
