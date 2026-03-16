const { Client } = require('pg');
async function run() {
    const client = new Client({ connectionString: 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@postgres-production-a008.up.railway.app:5432/railway' });
    try {
        await client.connect();
        const res = await client.query("SELECT id FROM users WHERE email = 'racv85@gmail.com'");
        console.log('User ID:', res.rows[0]?.id);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
run();
