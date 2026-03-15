const { Client } = require('pg');
const fs = require('fs');

// Read connection string from .env if we can
const envPath = 'apps/api/.env';
let connectionString = process.env.DATABASE_URL;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/DATABASE_URL=(.*)/);
  if (match) {
    connectionString = match[1].trim();
  }
}

if (!connectionString) {
  connectionString = 'postgresql://postgres:admin123@localhost:5432/polla_mundialista';
}

const client = new Client({
  connectionString: connectionString,
});

async function run() {
  try {
    await client.connect();
    const res = await client.query(`SELECT COUNT(*) FROM "matches" WHERE "tournamentId" = 'UCL2526'`);
    console.log(`\n=========================================\nTOTAL PARTIDOS UCL2526 EN DB: ${res.rows[0].count}\n=========================================\n`);
    await client.end();
  } catch (err) {
    console.error("DB Connection Error:", err);
  }
}

run();
