
const { Client } = require('pg');

async function checkPhases() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔍 Checking Phase Status for UCL2526...');

        const res = await client.query(`
            SELECT * FROM knockout_phase_status 
            WHERE "tournamentId" = 'UCL2526'
            ORDER BY phase
        `);
        
        console.log('\n📊 PHASES:');
        res.rows.forEach(r => {
            console.log(` - ${r.phase}: Unlocked=${r.is_unlocked}`);
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkPhases();
