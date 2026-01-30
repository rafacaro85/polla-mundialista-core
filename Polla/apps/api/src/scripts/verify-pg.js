
const { Client } = require('pg');

async function check() {
    const client = new Client({
        connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        const res = await client.query('SELECT COUNT(*) FROM matches WHERE "aiPrediction" IS NOT NULL');
        console.log(`\n==================================================`);
        console.log(`📊 PREDICCIONES EN PRODUCCIÓN: ${res.rows[0].count}`);
        console.log(`==================================================\n`);
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await client.end();
    }
}

check();
