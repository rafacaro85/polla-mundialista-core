const { Client } = require('pg');

const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function checkUCL() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        // 1. Check Matches for UCL2526
        console.log('\n🔍 Checking Matches for UCL2526...');
        const matches = await client.query(`
            SELECT id, "homeTeam", "awayTeam", phase, status 
            FROM matches 
            WHERE "tournamentId" = 'UCL2526'
            LIMIT 10;
        `);
        
        const count = await client.query(`SELECT COUNT(*) FROM matches WHERE "tournamentId" = 'UCL2526'`);
        
        console.log(`Found ${count.rows[0].count} matches for UCL2526.`);
        if (matches.rows.length > 0) {
            console.table(matches.rows);
        } else {
            console.warn('⚠️ NO MATCHES FOUND FOR UCL2526!');
        }

        // 2. Check Phases for UCL2526
        console.log('\n🔍 Checking Phases for UCL2526...');
        const phases = await client.query(`
            SELECT * FROM knockout_phase_status 
            WHERE "tournamentId" = 'UCL2526'
            ORDER BY id;
        `);
        console.table(phases.rows);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

checkUCL();
