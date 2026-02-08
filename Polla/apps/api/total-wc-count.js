const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT COUNT(*) FROM matches WHERE \"tournamentId\" = 'WC2026'");
    console.log('Total WC2026 matches:', res.rows[0].count);
    await client.end();
}
run();
