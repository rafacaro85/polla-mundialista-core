const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');

    const sqlPath = path.join(__dirname, 'src', 'database', 'migrations', '20260221_create_prizes_and_banners.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL...');
    await client.query(sql);
    console.log('SQL executed successfully');

    const tablesRes = await client.query("SELECT table_name FROM information_schema.tables WHERE table_name IN ('league_prizes', 'league_banners')");
    console.log('Verified tables:', tablesRes.rows);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
