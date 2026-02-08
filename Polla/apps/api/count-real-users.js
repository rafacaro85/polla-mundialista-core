const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT COUNT(*) FROM users WHERE email NOT LIKE '%@demo.com' AND email NOT IN ('demo@lapollavirtual.com', 'demo-social@lapollavirtual.com')");
    console.log('Usuarios Reales:', res.rows[0].count);
    await client.end();
}
run();
