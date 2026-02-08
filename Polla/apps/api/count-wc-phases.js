const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT phase, COUNT(*) FROM matches WHERE \"tournamentId\" = 'WC2026' GROUP BY phase");
    console.table(res.rows);
    await client.end();
}
run();
