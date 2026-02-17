
const { Client } = require('pg');

async function checkRanking() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/polla'
    });

    try {
        await client.connect();
        
        console.log(`--- Checking ALL FINISHED matches ---`);
        const matchesRes = await client.query(`
            SELECT id, "tournamentId", "homeTeam", "awayTeam", status, phase 
            FROM matches 
            WHERE status = 'FINISHED'
        `);
        console.table(matchesRes.rows);

        console.log(`--- Checking ALL Predictions ---`);
        const predRes = await client.query(`
            SELECT p.id, p."userId", u.nickname, p.points, p."league_id", m."tournamentId", m."homeTeam", m."awayTeam"
            FROM predictions p
            JOIN matches m ON m.id = p."matchId"
            JOIN users u ON u.id = p."userId"
            ORDER BY p.id DESC LIMIT 10
        `);
        console.table(predRes.rows);

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

checkRanking();
