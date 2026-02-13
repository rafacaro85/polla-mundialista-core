
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

    const res = await client.query(`
      SELECT DISTINCT "homeTeam" as team 
      FROM matches 
      WHERE "tournamentId" = 'UCL2526' 
      ORDER BY team ASC
    `);

    console.log('Teams in UCL2526:');
    res.rows.forEach(r => console.log(`- ${r.team}`));

  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
