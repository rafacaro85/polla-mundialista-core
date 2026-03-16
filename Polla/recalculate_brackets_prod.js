if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: 'apps/api/.env' });
}
const { Client } = require('pg');

async function recalculate() {
    let url = process.env.DATABASE_URL;
    if (url && url.includes('postgres.railway.internal')) {
        console.log('🔄 Detectada URL interna de Railway, cambiando a pública para acceso externo...');
        url = url.replace('postgres.railway.internal', 'postgres-production-a008.up.railway.app');
    }

    const client = new Client({ connectionString: url });
    await client.connect();

    try {
        console.log('🔄 Reiniciando puntos de brackets a 0...');
        await client.query('UPDATE user_brackets SET points = 0');

        console.log('📊 Obteniendo partidos finalizados de rondas eliminatorias...');
        // Filtramos por fases que no sean de grupos (aunque el usuario dijo Brackets, el servicio filtra por phase)
        const matchesRes = await client.query(`
            SELECT id, "homeScore", "awayScore", "homeTeam", "awayTeam", phase, "tournamentId"
            FROM matches
            WHERE status = 'FINISHED' AND phase NOT LIKE 'GROUP%'
        `);

        console.log(`Encontrados ${matchesRes.rows.length} partidos para procesar.`);

        for (const match of matchesRes.rows) {
            const winner = match.homeScore > match.awayScore ? match.homeTeam : match.awayTeam;
            console.log(`Procesando match ${match.id}: ${match.homeTeam} vs ${match.awayTeam} (Winner: ${winner})`);

            // Actualizar brackets que acertaron
            const updateRes = await client.query(`
                UPDATE user_brackets
                SET points = points + 2
                WHERE "tournamentId" = $1 AND picks->>$2 = $3
            `, [match.tournamentId, match.id, winner]);

            console.log(`  Actualizados ${updateRes.rowCount} brackets.`);
        }

        console.log('✅ Recálculo completado con éxito.');
    } catch (err) {
        console.error('❌ Error durante el recálculo:', err);
    } finally {
        await client.end();
    }
}

recalculate();
