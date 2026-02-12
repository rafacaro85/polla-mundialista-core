
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function debugRanking() {
  try {
    await client.connect();
    
    // Check Match columns
    console.log('--- Matches Columns ---');
    const ubaCols = await client.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'matches'`);
    console.table(ubaCols.rows.map(r => r.column_name));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

debugRanking();
