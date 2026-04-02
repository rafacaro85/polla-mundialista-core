const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:lAbqgwhmSALnYLFxmHHTEOyuzMqqzsRS@ballast.proxy.rlwy.net:50167/railway' });
client.connect().then(async () => {
    const res = await client.query('SELECT id, name, type, \"tournamentId\" FROM leagues WHERE name ILIKE \'%People%\'');
    console.log(JSON.stringify(res.rows, null, 2));
    client.end();
}).catch(err => { console.error(err); process.exit(1); });
