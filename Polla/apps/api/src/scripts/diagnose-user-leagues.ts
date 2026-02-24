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
  console.log('🔌 Connected to PROD DB for participation diagnosis');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // 1. Find the league "FAMILIA" to get the user ID
    const famLeagues = await queryRunner.query(`
      SELECT id, name, "creatorId" 
      FROM leagues 
      WHERE name ILIKE '%FAMILIA%'
    `);
    
    if (famLeagues.length === 0) {
        console.log('❌ League "FAMILIA" not found');
        return;
    }

    const userId = famLeagues[0].creatorId;
    console.log(`👤 Found Creator ID of FAMILIA: ${userId}`);

    // 2. See how many leagues this user is a participant of
    const participations = await queryRunner.query(`
      SELECT p.id as p_id, l.id as l_id, l.name, l."tournamentId", p.status
      FROM league_participants p
      JOIN leagues l ON p.league_id = l.id
      WHERE p.user_id = '${userId}'
    `);

    console.log(`\n📋 User Participations (${participations.length}):`);
    participations.forEach((p: any) => {
        console.log(`- [${p.tournamentId}] ${p.name} (Status: ${p.status})`);
    });

    // 3. See if there are leagues created by this user but NOT in participations
    const createdNoPart = await queryRunner.query(`
        SELECT id, name, "tournamentId"
        FROM leagues
        WHERE "creatorId" = '${userId}'
        AND id NOT IN (SELECT league_id FROM league_participants WHERE user_id = '${userId}')
    `);

    if (createdNoPart.length > 0) {
        console.log(`\n⚠️ Created leagues WITHOUT participation record (${createdNoPart.length}):`);
        createdNoPart.forEach((p: any) => {
            console.log(`- [${p.tournamentId}] ${p.name}`);
        });
    } else {
        console.log('\n✅ All created leagues have a participation record.');
    }

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
