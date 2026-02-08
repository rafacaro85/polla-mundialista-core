const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT id, \"homeTeam\", \"awayTeam\", phase, \"tournamentId\", \"homeTeamPlaceholder\", \"awayTeamPlaceholder\" FROM matches WHERE phase = 'ROUND_32' ORDER BY \"bracketId\"");
    console.log('Total ROUND_32 matches found:', res.rows.length);
    res.rows.forEach(r => console.log(`${r.id} | ${r.homeTeam} vs ${r.awayTeam} | ${r.tournamentId} | P1: ${r.homeTeamPlaceholder} | P2: ${r.awayTeamPlaceholder}`));
    await client.end();
}
run();
