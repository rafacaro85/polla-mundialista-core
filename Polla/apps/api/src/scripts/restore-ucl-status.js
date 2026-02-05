
const { Client } = require('pg');

async function restoreStatus() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔄 Reverting Status to SCHEDULED for UCL Playoff...');

        const res = await client.query(`
            UPDATE matches 
            SET status = 'SCHEDULED' 
            WHERE "tournamentId" = 'UCL2526' AND phase = 'PLAYOFF' AND status = 'PENDING'
        `);

        console.log(`✅ Updated ${res.rowCount} matches to SCHEDULED.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

restoreStatus();
