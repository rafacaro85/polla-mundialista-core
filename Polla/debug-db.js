
const { DataSource } = require('typeorm');
require('dotenv').config({ path: 'apps/api/.env' });

async function checkLeagues() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'polla_db',
    entities: ['apps/api/src/database/entities/*.ts'],
    synchronize: false,
  });

  try {
    await ds.initialize();
    console.log('DB Initialized');
    const leagues = await ds.query('SELECT id, name, "tournamentId", is_paid FROM leagues');
    console.log('Leagues:', JSON.stringify(leagues, null, 2));
    
    const transactions = await ds.query('SELECT id, "tournamentId", status, "leagueId" FROM transactions');
    console.log('Transactions:', JSON.stringify(transactions, null, 2));

    const participants = await ds.query('SELECT * FROM league_participants');
    console.log('Participants Count:', participants.length);

  } catch (err) {
    console.error(err);
  } finally {
    await ds.destroy();
  }
}

checkLeagues();
