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
  console.log('🔌 Connected to PROD DB for data recovery analysis');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // 1. Inspect the 16 records with NULL user_id
    const nullParticipants = await queryRunner.query(`
        SELECT p.id, p.league_id, l.name, l.creator_id, l."tournamentId"
        FROM league_participants p
        JOIN leagues l ON p.league_id = l.id
        WHERE p.user_id IS NULL
    `);
    
    console.log(`\n🕵️ Details of ${nullParticipants.length} orphaned participations:`);
    nullParticipants.forEach((p: any) => {
        console.log(`- ID: ${p.id}, League: ${p.name}, Creator: ${p.creatorId}, Tournament: ${p.tournamentId}`);
    });

    // 2. See if the Creator ID of these leagues exists in the users table
    if (nullParticipants.length > 0) {
        const creatorIds = [...new Set(nullParticipants.map((p: any) => p.creatorId))].filter(id => id);
        if (creatorIds.length > 0) {
            const creators = await queryRunner.query(`
                SELECT id, email, nickname 
                FROM users 
                WHERE id IN (${creatorIds.map(id => `'${id}'`).join(',')})
            `);
            console.log(`\n👤 Founders found in users table:`);
            creators.forEach((c: any) => {
                console.log(`- ${c.nickname} (${c.email}) ID: ${c.id}`);
            });
        }
    }

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
