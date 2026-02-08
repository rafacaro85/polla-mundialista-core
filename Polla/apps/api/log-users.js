const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT email, full_name, nickname FROM users LIMIT 10");
    res.rows.forEach(r => console.log(`${r.email} | ${r.full_name} | ${r.nickname}`));
    await client.end();
}
run();
