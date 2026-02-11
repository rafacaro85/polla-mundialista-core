const { Client } = require('pg');

async function checkPhases() {
    const client = new Client({
        connectionString: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway",
        ssl: false
    });

    try {
        await client.connect();
        const res = await client.query('SELECT * FROM knockout_phase_status WHERE "tournamentId" = $1', ['UCL2526']);
        console.table(res.rows);
        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkPhases();
