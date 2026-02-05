
const { Client } = require('pg');

async function checkStatus() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔍 Checking Status of UCL2526 PLAYOFF matches...');

        const res = await client.query(`
            SELECT status, COUNT(*) as count 
            FROM matches 
            WHERE "tournamentId" = 'UCL2526' AND phase = 'PLAYOFF'
            GROUP BY status
        `);
        
        console.log('\n📊 STATUS DISTRIBUTION:');
        res.rows.forEach(r => {
            console.log(` - ${r.status}: ${r.count} matches`);
        });

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

checkStatus();
