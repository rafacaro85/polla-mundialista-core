const { Client } = require('pg');

const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function fixUCLWait() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        
        console.log('🔨 Fixing UCL2526 Phases...');
        
        // 1. Check existing matches phase
        const matchPhasesResult = await client.query('SELECT DISTINCT phase FROM matches WHERE "tournamentId" = \'UCL2526\'');
        const matchPhases = matchPhasesResult.rows.map(r => r.phase);
        
        console.log(`⚽ Matches found in phases: ${matchPhases.join(', ') || 'NONE'}`);

        // If no matches, warn user (or create dummy ones if needed later)
        if (matchPhases.length === 0) {
            console.warn('⚠️ Alert: No matches found for UCL2526. You might need to seed matches separately.');
        }

        // 2. Delete WRONG phases (GROUP, ROUND_32 from WC2026 logic) for UCL2526
        console.log('🗑️  Deleting incorrect phases for UCL2526...');
        await client.query('DELETE FROM knockout_phase_status WHERE "tournamentId" = \'UCL2526\'');
        
        // 3. Insert CORRECT phases for UCL (Starting from PLAYOFF as requested)
        console.log('🔄 Creating correct phases (PLAYOFF -> ROUND_16 -> QUARTER -> SEMI -> FINAL)...');
        
        await client.query(`
            INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, unlocked_at, all_matches_completed, is_manually_locked, created_at, updated_at)
            VALUES 
              ('PLAYOFF', 'UCL2526', true, NOW(), false, false, NOW(), NOW()),
              ('ROUND_16', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('QUARTER', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('SEMI', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('FINAL', 'UCL2526', false, NULL, false, false, NOW(), NOW());
        `);
        
        console.log('✅ UCL2526 Phases fixed!');
        
        // 4. Verify
        const newPhases = await client.query('SELECT phase, is_unlocked FROM knockout_phase_status WHERE "tournamentId" = \'UCL2526\' ORDER BY id');
        console.table(newPhases.rows);

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
    }
}

fixUCLWait();
