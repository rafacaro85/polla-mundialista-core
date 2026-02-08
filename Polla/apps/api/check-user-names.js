const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT email, full_name, nickname FROM users WHERE nickname IN ('joluma1523', 'emilio1castro2025', 'alejoestepario') OR full_name LIKE '%Joluma%' LIMIT 5");
    console.table(res.rows);
    await client.end();
}
run();
