const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'admin123',
        database: process.env.DB_DATABASE || 'polla_mundialista'
    });

    try {
        await client.connect();
        console.log('✅ Conectado a:', client.database);
        const res = await client.query('SELECT email, full_name FROM users');
        console.log('📋 Usuarios Registrados:');
        console.table(res.rows);
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        await client.end();
    }
}
run();
