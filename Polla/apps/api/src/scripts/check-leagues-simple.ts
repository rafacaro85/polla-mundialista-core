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
  console.log('🔌 Connected to PROD DB');

  const queryRunner = AppDataSource.createQueryRunner();

  // Check all leagues
  const leagues = await queryRunner.query(`SELECT * FROM leagues LIMIT 5`);

  console.log('\n📊 Sample Leagues:');
  leagues.forEach((league: any) => {
    console.log(`\nID: ${league.id}`);
    console.log(`Name: ${league.name}`);
    console.log(`Tournament ID: ${league.tournament_id || 'NULL'}`);
    console.log(`Type: ${league.type}`);
    console.log(`---`);
  });

  await AppDataSource.destroy();
}

run().catch(console.error);
