const { Client } = require('pg');

const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function resetPhases() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Railway database');

        // First, let's check the table structure
        console.log('\n🔍 Checking table structure...');
        const tableInfo = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'knockout_phase_status'
            ORDER BY ordinal_position;
        `);
        console.log('Table columns:');
        console.table(tableInfo.rows);

        // 1. Delete all existing phases
        console.log('\n🗑️  Deleting all existing knockout phases...');
        const deleteResult = await client.query('DELETE FROM knockout_phase_status;');
        console.log(`✅ Deleted ${deleteResult.rowCount} rows`);

        // 2. Insert phases for WC2026
        console.log('\n🔄 Creating phases for WC2026...');
        await client.query(`
            INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, unlocked_at, all_matches_completed, is_manually_locked, created_at, updated_at)
            VALUES 
              ('GROUP', 'WC2026', true, NOW(), false, false, NOW(), NOW()),
              ('ROUND_32', 'WC2026', false, NULL, false, false, NOW(), NOW()),
              ('ROUND_16', 'WC2026', false, NULL, false, false, NOW(), NOW()),
              ('QUARTER', 'WC2026', false, NULL, false, false, NOW(), NOW()),
              ('SEMI', 'WC2026', false, NULL, false, false, NOW(), NOW()),
              ('FINAL', 'WC2026', false, NULL, false, false, NOW(), NOW());
        `);
        console.log('✅ WC2026 phases created');

        // 3. Insert phases for DEMO_WC2026
        console.log('\n🔄 Creating phases for DEMO_WC2026...');
        await client.query(`
            INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, unlocked_at, all_matches_completed, is_manually_locked, created_at, updated_at)
            VALUES 
              ('GROUP', 'DEMO_WC2026', true, NOW(), false, false, NOW(), NOW()),
              ('ROUND_32', 'DEMO_WC2026', false, NULL, false, false, NOW(), NOW()),
              ('ROUND_16', 'DEMO_WC2026', false, NULL, false, false, NOW(), NOW()),
              ('QUARTER', 'DEMO_WC2026', false, NULL, false, false, NOW(), NOW()),
              ('SEMI', 'DEMO_WC2026', false, NULL, false, false, NOW(), NOW()),
              ('FINAL', 'DEMO_WC2026', false, NULL, false, false, NOW(), NOW());
        `);
        console.log('✅ DEMO_WC2026 phases created');

        // 4. Insert phases for UCL2526
        console.log('\n🔄 Creating phases for UCL2526...');
        await client.query(`
            INSERT INTO knockout_phase_status (phase, "tournamentId", is_unlocked, unlocked_at, all_matches_completed, is_manually_locked, created_at, updated_at)
            VALUES 
              ('GROUP', 'UCL2526', true, NOW(), false, false, NOW(), NOW()),
              ('ROUND_32', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('ROUND_16', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('QUARTER', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('SEMI', 'UCL2526', false, NULL, false, false, NOW(), NOW()),
              ('FINAL', 'UCL2526', false, NULL, false, false, NOW(), NOW());
        `);
        console.log('✅ UCL2526 phases created');

        // 5. Verify
        console.log('\n📊 Verifying results...');
        const result = await client.query(`
            SELECT "tournamentId", phase, is_unlocked, all_matches_completed
            FROM knockout_phase_status
            ORDER BY "tournamentId", phase;
        `);
        
        console.log('\n✅ Current phases in database:');
        console.table(result.rows);

        console.log('\n🎉 Knockout phases reset successfully!');
        console.log('   - WC2026: 6 phases created');
        console.log('   - DEMO_WC2026: 6 phases created');
        console.log('   - UCL2526: 6 phases created');
        console.log('   - Total: 18 phases');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await client.end();
        console.log('\n✅ Database connection closed');
    }
}

resetPhases();
