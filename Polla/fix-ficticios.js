const { Client } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: 'apps/api/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function run() {
    await client.connect();
    // Mapa basado en wc2026-real.seeder.ts
    const map = {
        'Chile': 'PLA_A',
        'Suecia': 'PLA_B',
        'Perú': 'PLA_C',
        'Gales': 'PLA_D',
        'Polonia': 'PLA_E',
        'Costa Rica': 'PLA_F',
        // También renombrar los anteriores por si acaso
        'Ganador Repechaje A': 'PLA_A', 'Pendiente A': 'PLA_A',
        'Ganador Repechaje B': 'PLA_B', 'Pendiente B': 'PLA_B',
        'Ganador Repechaje C': 'PLA_C', 'Pendiente C': 'PLA_C',
        'Ganador Repechaje D': 'PLA_D', 'Pendiente D': 'PLA_D',
        'Ganador Repechaje E': 'PLA_E', 'Pendiente E': 'PLA_E',
        'Ganador Repechaje F': 'PLA_F', 'Pendiente F': 'PLA_F',
    };

    let total = 0;
    for (const [oldName, newName] of Object.entries(map)) {
        const res1 = await client.query("UPDATE matches SET \"homeTeam\" = $1 WHERE \"homeTeam\" = $2", [newName, oldName]);
        const res2 = await client.query("UPDATE matches SET \"awayTeam\" = $1 WHERE \"awayTeam\" = $2", [newName, oldName]);
        if (res1.rowCount + res2.rowCount > 0) {
            console.log(`Updated ${oldName} to ${newName}: ${res1.rowCount + res2.rowCount} matches`);
        }
        total += res1.rowCount + res2.rowCount;
    }
    console.log(`Total Updates: ${total}`);
    await client.end();
}
run().catch(console.error);
