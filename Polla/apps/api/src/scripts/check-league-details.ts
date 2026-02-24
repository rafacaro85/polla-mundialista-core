import { DataSource } from 'typeorm';

const AppDataSource = new DataSource({
  type: 'postgres',
  url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway',
  ssl: { rejectUnauthorized: false },
  synchronize: false,
  entities: [],
});

async function run() {
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const leagueId = 'dd66e5d4-9f45-4330-a539-69ba98414e2a'; // From screenshot
    const league = await queryRunner.query(`
        SELECT id, name, "tournamentId", is_enterprise
        FROM leagues 
        WHERE id = '${leagueId}'
    `);
    
    console.log(`\n📋 League Data for ${leagueId}:`);
    console.log(JSON.stringify(league[0], null, 2));

    const participants = await queryRunner.query(`
        SELECT p.user_id, u.email, u.nickname, p.status
        FROM league_participants p
        JOIN users u ON p.user_id = u.id
        WHERE p.league_id = '${leagueId}'
    `);
    console.log(`\n👥 Participants (${participants.length}):`);
    participants.forEach((p: any) => {
        console.log(`- ${p.nickname} (${p.email}) Status: ${p.status}`);
    });

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
