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
    const emails = ['rcarov85@gmail.com', 'racv8@gmail.com', 'racv85@gmail.com', 'racv85@hotmail.com', 'cosasdedioss@gmail.com'];
    
    console.log('🔍 Comparing participations for potential user emails:');

    for (const email of emails) {
        const user = await queryRunner.query(`SELECT id, email, nickname FROM users WHERE email = '${email}'`);
        if (user.length > 0) {
            const userId = user[0].id;
            const count = await queryRunner.query(`SELECT COUNT(*) FROM league_participants WHERE user_id = '${userId}'`);
            console.log(`- ${email} (${user[0].nickname}): ${count[0].count} leagues`);
            
            if (count[0].count > 0) {
                const names = await queryRunner.query(`
                    SELECT l.name, l."tournamentId" 
                    FROM league_participants p
                    JOIN leagues l ON p.league_id = l.id
                    WHERE p.user_id = '${userId}'
                `);
                names.forEach((n: any) => console.log(`   * [${n.tournamentId}] ${n.name}`));
            }
        } else {
            console.log(`- ${email}: NOT FOUND in users table`);
        }
    }

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
