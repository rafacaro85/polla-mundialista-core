const { Client } = require('pg');

const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function checkTable() {
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ Connected to Railway database\n');

        // Check table structure
        const tableInfo = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'knockout_phase_status'
            ORDER BY ordinal_position;
        `);
        
        console.log('📋 Table structure for knockout_phase_status:');
        tableInfo.rows.forEach(row => {
            console.log(`  - ${row.column_name} (${row.data_type}) ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
        });

        // Check current data
        console.log('\n📊 Current data:');
        const data = await client.query('SELECT * FROM knockout_phase_status ORDER BY id;');
        console.table(data.rows);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkTable();
