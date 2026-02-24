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
  console.log('🔌 Connected to PROD DB for service simulation');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    const userId = '65bf8db4-3f6d-407e-8ba0-4a6b2b6a276f'; // User from my previous check (Rafa)
    
    // Simulate the query in getMyLeagues
    const participants = await queryRunner.query(`
      SELECT p.is_admin, l.id, l.name, l."tournamentId", l.is_enterprise, l.company_name
      FROM league_participants p
      INNER JOIN leagues l ON p.league_id = l.id
      WHERE p.user_id = '${userId}'
    `);

    console.log(`\n📋 Service Simulation Result for User ${userId}:`);
    participants.forEach((p: any) => {
        console.log(`- League: ${p.name}, TournamentId: ${p.tournamentId}, Enterprise: ${p.is_enterprise}`);
    });

  } catch (err) {
    console.error('❌ Simulation failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
