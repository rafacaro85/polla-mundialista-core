
const { Client } = require('pg');

async function unlockPlayoff() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🔓 Unlocking PLAYOFF for UCL2526...');

        const res = await client.query(`
            UPDATE knockout_phase_status 
            SET is_unlocked = true 
            WHERE "tournamentId" = 'UCL2526' AND phase = 'PLAYOFF'
        `);
        
        console.log(`✅ Updated ${res.rowCount} row(s).`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

unlockPlayoff();
