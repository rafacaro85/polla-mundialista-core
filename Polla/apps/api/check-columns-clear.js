const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';
async function run() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    const res = await client.query("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('predictions', 'user_brackets')");
    res.rows.forEach(r => console.log(`${r.table_name}.${r.column_name}`));
    await client.end();
}
run();
