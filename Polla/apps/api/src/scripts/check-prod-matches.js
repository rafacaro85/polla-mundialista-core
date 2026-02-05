
const { Client } = require('pg');

async function check() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log('🔍 Checking Matches in Prod...');

        // 1. Check for Matches in WC2026 that have 'PLAYOFF' phase (impossible, only UCL has Playoff)
        const resStats = await client.query(`
            SELECT "tournamentId", phase, COUNT(*) as count 
            FROM matches 
            GROUP BY "tournamentId", phase 
            ORDER BY "tournamentId", phase
        `);
        
        console.log('\n📊 MATCH STATS:');
        resStats.rows.forEach(r => {
            console.log(` - [${r.tournamentId}] ${r.phase}: ${r.count} matches`);
        });

        const wcPlayoff = resStats.rows.find(r => r.tournamentId === 'WC2026' && r.phase === 'PLAYOFF');
        if (wcPlayoff) {
            console.log(`\n🚨 ALARM: Found ${wcPlayoff.count} PLAYOFF matches in WC2026!`);
            // Fix them? if count is small and they look like UCL matches?
        } else {
            console.log('\n✅ No PLAYOFF matches in WC2026.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

check();
