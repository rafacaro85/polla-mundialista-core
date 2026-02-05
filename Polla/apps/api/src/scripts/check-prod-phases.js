
const { Client } = require('pg');

async function check() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    
    console.log('🔌 Connecting to Production DB...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false } // Required for Railway usually
    });

    try {
        await client.connect();
        console.log('✅ Connected!');

        console.log('🔍 Querying knockout_phase_status...');
        const res = await client.query('SELECT * FROM knockout_phase_status ORDER BY "tournamentId", phase');
        
        console.log('\n📊 PHASES FOUND:');
        res.rows.forEach(r => {
            console.log(` - [${r.tournamentId}] ${r.phase}: Unlocked=${r.is_unlocked}, Completed=${r.allMatchesCompleted}, Locked=${r.isManuallyLocked || false}`);
        });

        // Check for anomalies
        const wcPlayoff = res.rows.find(r => r.tournamentId === 'WC2026' && r.phase === 'PLAYOFF');
        if (wcPlayoff) {
            console.log('\n⚠️ ALARM: FOUND PLAYOFF IN WC2026! This is causing the simulation confusion.');
            console.log('✨ Attempting to DELETE it...');
            await client.query("DELETE FROM knockout_phase_status WHERE phase = 'PLAYOFF' AND \"tournamentId\" = 'WC2026'");
            console.log('✅ DELETED Playoff from WC2026.');
        } else {
            console.log('\n✅ No spurious PLAYOFF phase found in WC2026.');
        }

    } catch (err) {
        console.error('❌ Connection Error:', err);
    } finally {
        await client.end();
    }
}

check();
