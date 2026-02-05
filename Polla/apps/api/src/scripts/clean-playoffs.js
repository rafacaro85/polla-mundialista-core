
const { Client } = require('pg');

async function clean() {
    const connectionString = "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway";
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('🧹 Cleaning duplicate PLAYOFFS matches in UCL2526...');

        // Verify duplicates before deleting
        const valid = await client.query(`SELECT COUNT(*) as count FROM matches WHERE phase = 'PLAYOFF' AND "tournamentId" = 'UCL2526'`);
        const invalid = await client.query(`SELECT COUNT(*) as count FROM matches WHERE phase = 'PLAYOFFS' AND "tournamentId" = 'UCL2526'`);

        console.log(`Phase 'PLAYOFF' (Valid): ${valid.rows[0].count} matches`);
        console.log(`Phase 'PLAYOFFS' (Invalid): ${invalid.rows[0].count} matches`);

        if (parseInt(invalid.rows[0].count) > 0) {
            console.log('🗑️ Deleting invalid matches with phase MATCH "PLAYOFFS"...');
            await client.query(`DELETE FROM matches WHERE phase = 'PLAYOFFS' AND "tournamentId" = 'UCL2526'`);
            
            // Also clean up phase status if exists
            await client.query(`DELETE FROM knockout_phase_status WHERE phase = 'PLAYOFFS' AND "tournamentId" = 'UCL2526'`);
            
            console.log('✅ Cleaned successfully.');
        } else {
            console.log('✅ No duplicates found or already cleaned.');
        }

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await client.end();
    }
}

clean();
