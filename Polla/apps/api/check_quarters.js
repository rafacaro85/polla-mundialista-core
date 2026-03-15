const { DataSource } = require('typeorm');
require('dotenv').config();

const ds = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'polla',
});

async function run() {
  await ds.initialize();
  const q = `SELECT id, bracketId, phase, \`group\`, homeTeam, awayTeam, status FROM matches WHERE phase IN ('QUARTER', 'QUARTER_FINAL') AND tournamentId = 3;`;
  const res = await ds.query(q);
  console.log(JSON.stringify(res, null, 2));
  await ds.destroy();
}

run().catch(console.error);
