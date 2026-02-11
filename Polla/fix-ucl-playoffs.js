const { Client } = require('pg');

async function fixUCLPhases() {
    const client = new Client({
        connectionString: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway",
        ssl: false
    });

    try {
        await client.connect();
        console.log('✅ Conectado a la DB de Producción');

        // 1. Cambiar los partidos inyectados de ROUND_16 a PLAYOFF
        const updateMatchesQuery = `
            UPDATE matches 
            SET phase = 'PLAYOFF', "group" = 'PO'
            WHERE "tournamentId" = 'UCL2526' AND phase = 'ROUND_16';
        `;
        const resMatches = await client.query(updateMatchesQuery);
        console.log(`✅ Se actualizaron ${resMatches.rowCount} partidos a la fase PLAYOFF.`);

        // 2. Bloquear ROUND_16 y Desbloquear PLAYOFF en knockout_phase_status
        const phasesToFix = [
            { phase: 'PLAYOFF', unlocked: true },
            { phase: 'ROUND_16', unlocked: false }
        ];

        for (const item of phasesToFix) {
            const query = `
                INSERT INTO knockout_phase_status 
                ("tournamentId", "phase", "is_unlocked", "all_matches_completed", "is_manually_locked")
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT ("tournamentId", "phase") DO UPDATE 
                SET "is_unlocked" = EXCLUDED."is_unlocked";
            `;
            await client.query(query, ['UCL2526', item.phase, item.unlocked, false, false]);
            console.log(`✅ Fase ${item.phase} configurada como Desbloqueada: ${item.unlocked}`);
        }

        await client.end();
    } catch (err) {
        console.error('❌ Error al corregir fases:', err);
        process.exit(1);
    }
}

fixUCLPhases();
