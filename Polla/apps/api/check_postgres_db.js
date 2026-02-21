const { Client } = require('pg');
async function run() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'admin123',
        database: 'postgres' // Default DB
    });
    try {
        await client.connect();
        console.log('✅ Conectado a: postgres');
        const res = await client.query("SELECT count(*) FROM users");
        console.log('📋 Usuarios en postgres:', res.rows[0].count);
    } catch (err) {
        console.error('❌ Error en postgres:', err.message);
    } finally {
        await client.end();
    }
}
run();
