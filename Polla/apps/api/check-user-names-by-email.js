const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT email, full_name, nickname FROM users WHERE email LIKE 'joluma%' OR email LIKE 'emilio1castro%' LIMIT 5");
    console.table(res.rows);
    await client.end();
}
run();
