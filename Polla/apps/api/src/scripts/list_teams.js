const { Client } = require('pg');

const DB_URL = "postgresql://postgres:admin123@localhost:5432/polla_mundialista";

async function run() {
    const client = new Client({
        connectionString: DB_URL,
        ssl: false
    });

    await client.connect();
    
    try {
        // const res = await client.query(`SELECT "tournamentId", count(*) FROM matches GROUP BY "tournamentId"`);
        // console.log("Tournament Counts:", res.rows);
        
        const res2 = await client.query(`SELECT "homeTeam" FROM matches WHERE "homeTeam" ILIKE '%Real%'`);
        console.log("Teams looking like Real:", res2.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
