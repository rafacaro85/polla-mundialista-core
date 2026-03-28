const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function checkWCPhases() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
        const res = await client.query(`SELECT DISTINCT phase FROM matches WHERE "tournamentId" = 'WC2026'`);
        console.log(res.rows.map(r => r.phase));
    } finally {
        await client.end();
    }
}
checkWCPhases();
