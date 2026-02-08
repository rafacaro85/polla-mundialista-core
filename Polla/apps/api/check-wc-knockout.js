const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT id, \"homeTeam\", \"awayTeam\", phase, \"tournamentId\" FROM matches WHERE \"tournamentId\" = 'WC2026' AND phase IN ('ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL') ORDER BY phase, \"bracketId\"");
    console.log('Total matches found:', res.rows.length);
    res.rows.forEach(r => console.log(`${r.id} | ${r.homeTeam} vs ${r.awayTeam} | ${r.phase}`));
    await client.end();
}
run();
