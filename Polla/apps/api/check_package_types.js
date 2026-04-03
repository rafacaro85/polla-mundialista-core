
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password123',
  database: 'polla_db',
});

async function runQuery() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT DISTINCT package_type, 
             is_enterprise,
             COUNT(*) as total
      FROM leagues
      GROUP BY package_type, is_enterprise
      ORDER BY is_enterprise, package_type;
    `);
    console.table(res.rows);
  } catch (err) {
    console.error('Error executing query:', err.stack);
  } finally {
    await client.end();
  }
}

runQuery();
