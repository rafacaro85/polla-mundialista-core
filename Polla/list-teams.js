const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: 'apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    const res = await client.query(`
        SELECT DISTINCT team FROM (
            SELECT "homeTeam" as team FROM matches
            UNION
            SELECT "awayTeam" as team FROM matches
        ) t ORDER BY team
    `);
    console.log(res.rows.map(r => r.team));
    await client.end();
}

run().catch(console.error);
