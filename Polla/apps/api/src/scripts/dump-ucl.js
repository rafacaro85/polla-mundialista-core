
const { Client } = require('pg');

async function dump() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log('📦 Dumping UCL Playoff Matches...');
        const res = await client.query(`
            SELECT id, "homeTeam", "awayTeam", status, date, phase, "tournamentId"
            FROM matches 
            WHERE "tournamentId" = 'UCL2526' AND phase = 'PLAYOFF'
        `);

        if (res.rows.length === 0) {
            console.log('❌ No matches found!');
        } else {
            res.rows.forEach(r => {
                console.log(`[${r.status}] ${r.date.toISOString().split('T')[0]} | ${r.homeTeam} vs ${r.awayTeam}`);
            });
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

dump();
