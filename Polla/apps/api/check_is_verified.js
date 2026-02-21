const { Client } = require('pg');
async function run() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'admin123',
        database: 'polla_mundialista'
    });
    await client.connect();
    const res = await client.query("SELECT email, is_verified, role FROM users WHERE email = 'admin@admin.com'");
    console.table(res.rows);
    await client.end();
}
run();
