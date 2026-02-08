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

    // 1. Check what matches the enterprise league is getting
    const enterpriseLeague = await queryRunner.query(`
        SELECT id, name, "tournamentId" 
        FROM leagues 
        WHERE name = 'Prueba empresa'
    `);
    
    console.log('\n📊 Enterprise League:', enterpriseLeague[0]);

    // 2. Check matches for this tournament
    const tournamentId = enterpriseLeague[0]?.tournamentId || 'WC2026';
    const matchesByPhase = await queryRunner.query(`
        SELECT phase, COUNT(*) as count
        FROM matches
        WHERE "tournamentId" = $1
        GROUP BY phase
        ORDER BY phase
    `, [tournamentId]);
    
    console.log(`\n⚽ Matches by phase for ${tournamentId}:`);
    matchesByPhase.forEach((p: any) => {
        console.log(`${p.phase}: ${p.count} matches`);
    });

    // 3. Check knockout matches with defined teams (should not exist yet)
    const knockoutWithTeams = await queryRunner.query(`
        SELECT id, phase, "homeTeam", "awayTeam", date
        FROM matches
        WHERE "tournamentId" = $1
        AND phase IN ('ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL', '3RD_PLACE')
        AND "homeTeam" IS NOT NULL
        AND "homeTeam" != ''
        AND "homeTeam" NOT LIKE '%W%'
        AND "homeTeam" NOT LIKE '%L%'
        AND "homeTeam" NOT LIKE '%RU%'
        ORDER BY date
        LIMIT 10
    `, [tournamentId]);
    
    console.log(`\n🚨 Knockout matches with defined teams (${knockoutWithTeams.length}):`);
    knockoutWithTeams.forEach((m: any) => {
        console.log(`${m.phase}: ${m.homeTeam} vs ${m.awayTeam}`);
    });

    await AppDataSource.destroy();
}

run().catch(console.error);
