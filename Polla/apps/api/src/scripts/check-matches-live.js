
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to DB');

    const res = await client.query(`
      SELECT id, "homeTeam", "awayTeam", status, "date", "isTimerActive", "minute", "phase"
      FROM matches 
      WHERE "tournamentId" = 'TEST_LIVE_MONDAY' 
      ORDER BY date ASC
    `);

    console.log(`Found ${res.rows.length} matches in TEST_LIVE_MONDAY:`);
    
    if (res.rows.length === 0) {
        console.log('No matches found. Run injection script.');
    } else {
        res.rows.forEach(r => {
            const d = new Date(r.date).toISOString();
            console.log(`- [${r.id}] ${r.homeTeam} vs ${r.awayTeam} | Phase: ${r.phase} | Status: ${r.status} | Date: ${d}`);
        });
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
