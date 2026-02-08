import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
    type: 'postgres',
    url: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway",
    ssl: { rejectUnauthorized: false }, 
    synchronize: false,
    entities: []
});

async function run() {
    await AppDataSource.initialize();
    console.log('🔌 Connected to PROD DB');
    
    const queryRunner = AppDataSource.createQueryRunner();

    // Get the "Prueba empresa" league
    const league = await queryRunner.query(`
        SELECT id, name, "tournamentId" 
        FROM leagues 
        WHERE name = 'Prueba empresa'
    `);
    
    console.log('\n📊 Prueba empresa league:');
    console.log(league[0]);

    if (league.length > 0) {
        const leagueId = league[0].id;
        
        // Get matches for this league
        const matches = await queryRunner.query(`
            SELECT m.id, m."homeTeam", m."awayTeam", m.phase, m."tournamentId", m.date
            FROM matches m
            WHERE m."tournamentId" = $1
            ORDER BY m.date
            LIMIT 10
        `, [league[0].tournamentId || 'WC2026']);
        
        console.log('\n⚽ Sample matches for this tournament:');
        matches.forEach((m: any) => {
            console.log(`${m.phase}: ${m.homeTeam} vs ${m.awayTeam} (${m.tournamentId})`);
        });

        // Check what phases exist
        const phases = await queryRunner.query(`
            SELECT DISTINCT phase, "tournamentId"
            FROM matches
            WHERE "tournamentId" = $1
            ORDER BY phase
        `, [league[0].tournamentId || 'WC2026']);
        
        console.log('\n📋 Phases in this tournament:');
        console.log(phases);
    }

    await AppDataSource.destroy();
}

run().catch(console.error);
