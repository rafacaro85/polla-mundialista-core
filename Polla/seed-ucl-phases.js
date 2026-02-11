const { Client } = require('pg');

async function seedUCLPhases() {
    const client = new Client({
        connectionString: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway",
        ssl: false
    });

    const PHASES = ['ROUND_16', 'QUARTER', 'SEMI', 'FINAL'];

    try {
        await client.connect();
        console.log('✅ Connected to DB');

        for (const phase of PHASES) {
            const query = `
                INSERT INTO knockout_phase_status 
                ("tournamentId", "phase", "is_unlocked", "all_matches_completed", "is_manually_locked")
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT ("tournamentId", "phase") DO UPDATE 
                SET "is_unlocked" = EXCLUDED."is_unlocked";
            `;
            // For UCL initialization, unlock ROUND_16 by default so users can see the injected matches
            const unlocked = phase === 'ROUND_16';
            await client.query(query, ['UCL2526', phase, unlocked, false, false]);
            console.log(`✅ Phase ${phase} initialized (Unlocked: ${unlocked})`);
        }

        await client.end();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

seedUCLPhases();
