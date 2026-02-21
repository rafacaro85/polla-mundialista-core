const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista' });
  try {
    await client.connect();
    
    // 1. Check League Participant Columns
    const resCols = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'league_participants'
    `);
    console.log('League Participant Columns:', resCols.rows.map(r => r.column_name));

    // 2. Check Tournaments in Matches
    const resTournaments = await client.query('SELECT DISTINCT "tournamentId" FROM matches');
    console.log('Tournaments in matches:', resTournaments.rows.map(r => r.tournamentId));

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
