
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Necessary for most cloud DBs
});

async function checkUCLMatches() {
  try {
    await client.connect();
    console.log('🔌 Connected to DB');

    // 1. Check distinct tournamentIds in MATCHES
    console.log('\n--- Distinct Tournament IDs in MATCHES table ---');
    const res = await client.query(`SELECT DISTINCT "tournamentId" FROM matches`);
    console.table(res.rows);

    // 2. Search for typical UCL Team Names to find where they are hiding
    const searchTerms = ['Real Madrid', 'Manchester City', 'Barcelona', 'Bayern', 'Liverpool'];
    console.log(`\n--- Searching for teams: ${searchTerms.join(', ')} ---`);
    
    for (const team of searchTerms) {
        const matches = await client.query(
            `SELECT id, "homeTeam", "awayTeam", "tournamentId" FROM matches 
             WHERE "homeTeam" ILIKE $1 OR "awayTeam" ILIKE $1 LIMIT 3`, 
            [`%${team}%`]
        );
        if (matches.rows.length > 0) {
            console.log(`Found matches for ${team}:`);
            console.table(matches.rows);
        } else {
            console.log(`No matches found for ${team}`);
        }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkUCLMatches();
