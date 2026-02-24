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
  console.log('🔌 Connected to PROD DB for Creator Access Recovery');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // 1. Identify leagues where the creator is NOT a participant
    // Using creator_id and league_participants column names found in deep introspection:
    // League columns: id, creator_id
    // Participant columns: user_id, league_id
    
    const missingParticipants = await queryRunner.query(`
        SELECT l.id as league_id, l.name, l.creator_id, l."tournamentId"
        FROM leagues l
        WHERE l.creator_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 
            FROM league_participants lp 
            WHERE lp.league_id = l.id 
            AND lp.user_id = l.creator_id
        )
    `);

    console.log(`\n🔍 Found ${missingParticipants.length} leagues where creator is missing from participation table.`);
    
    if (missingParticipants.length > 0) {
        console.log('Sample missing:', JSON.stringify(missingParticipants.slice(0, 3), null, 2));
        
        console.log('\n🛠️  Restoring creator participations...');
        
        for (const record of missingParticipants) {
            await queryRunner.query(`
                INSERT INTO league_participants (id, league_id, user_id, "isAdmin", status, total_points)
                VALUES (gen_random_uuid(), '${record.league_id}', '${record.creator_id}', true, 'ACTIVE', 0)
            `);
            console.log(`✅ Restored access for creator of league: ${record.name}`);
        }
    }

    // 3. Clean up the NULL user_id records that are confusing the system
    const rawCount = await queryRunner.query(`SELECT count(*) FROM league_participants WHERE user_id IS NULL`);
    if (rawCount[0].count > 0) {
        console.log(`\n🧹 Cleaning up ${rawCount[0].count} invalid records with NULL user_id...`);
        await queryRunner.query(`DELETE FROM league_participants WHERE user_id IS NULL`);
        console.log('✅ Clean up complete.');
    }

  } catch (err) {
    console.error('❌ Recovery failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
