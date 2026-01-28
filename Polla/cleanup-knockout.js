const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: 'apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function clean() {
    await client.connect();
    // Actualizar status a PENDING para que sean visibles
    const res = await client.query("UPDATE matches SET status = 'PENDING' WHERE phase != 'GROUP'");
    console.log(`Updated ${res.rowCount} matches.`);
    await client.end();
}

clean().catch(e => console.error(e));
