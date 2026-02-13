
const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');

    // Check a few teams that should have been updated
    const teamsToCheck = ['Atalanta', 'Benfica', 'Real Madrid'];
    
    for (const team of teamsToCheck) {
        const res = await client.query(`
            SELECT "homeTeam", "homeFlag" 
            FROM matches 
            WHERE "tournamentId" = 'UCL2526' AND "homeTeam" = $1
            LIMIT 1
        `, [team]);
        
        if (res.rows.length > 0) {
            console.log(`${team}: ${res.rows[0].homeFlag}`);
        } else {
            console.log(`${team}: No match found as home team.`);
        }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
