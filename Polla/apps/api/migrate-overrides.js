const { Client } = require('pg');

const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

async function migrate() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    console.log('🔄 Adding tournamentId to group_standing_overrides...');
    try {
        await client.query('ALTER TABLE group_standing_overrides ADD COLUMN "tournamentId" VARCHAR DEFAULT \'WC2026\'');
        console.log('✅ Column added successfully.');
    } catch (e) {
        if (e.code === '42701') {
            console.log('ℹ️ Column already exists.');
        } else {
            console.error('❌ Error adding column:', e);
        }
    }

    await client.end();
}

migrate();
