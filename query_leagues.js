const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:admin123@localhost:5432/polla_mundialista' });
client.connect().then(async () => {
    const res = await client.query('SELECT id, name, type, "tournamentId" FROM leagues WHERE LOWER(name) LIKE \'%heimcore%\'');
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
}).catch(err => { console.error(err); process.exit(1); });
