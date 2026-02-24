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
  console.log('🔌 Connected to PROD DB for diagnosis');

  const queryRunner = AppDataSource.createQueryRunner();

  try {
    // 1. Get column names including all possible variations
    const columns = await queryRunner.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leagues';
    `);
    
    const colNames = columns.map((c: any) => c.column_name);
    console.log('\n📅 Columns in "leagues" table:', colNames.join(', '));

    // 2. Identify the best column for ordering and metadata
    const tournamentCol = colNames.includes('tournamentId') ? '"tournamentId"' : (colNames.includes('tournament_id') ? 'tournament_id' : 'NULL');
    const enterpriseCol = colNames.includes('is_enterprise') ? 'is_enterprise' : (colNames.includes('isEnterprise') ? '"isEnterprise"' : 'NULL');
    const packageCol = colNames.includes('package_type') ? 'package_type' : (colNames.includes('packageType') ? '"packageType"' : 'NULL');
    
    // Search for ANY date column
    const dateCol = colNames.find((c: any) => c.toLowerCase().includes('create') || c.toLowerCase().includes('date') || c.toLowerCase().includes('at')) || 'id';
    console.log(`\n🕒 Using date column for sorting: ${dateCol}`);

    const sql = `
      SELECT id, name, ${tournamentCol} as "tournamentId", ${enterpriseCol} as "isEnterprise", ${packageCol} as "packageType"
      FROM leagues 
      ORDER BY ${dateCol} DESC 
      LIMIT 20;
    `;

    const leagues = await queryRunner.query(sql);

    console.log('\n📊 Recent Leagues (TOP 20):');
    leagues.forEach((l: any, i: number) => {
        console.log(`${i+1}. [${l.tournamentId}] ${l.name} (Enterprise: ${l.isEnterprise}, Pkg: ${l.packageType}) ID: ${l.id}`);
    });

    // 3. Count per tournament
    const tournamentCounts = await queryRunner.query(`
        SELECT ${tournamentCol} as "tournamentId", COUNT(*) 
        FROM leagues 
        GROUP BY ${tournamentCol}
    `);
    console.log('\n📈 League counts per Tournament ID:');
    tournamentCounts.forEach((c: any) => {
        console.log(`- ${c.tournamentId || 'NULL'}: ${c.count}`);
    });

  } catch (err) {
    console.error('❌ Diagnostic failed:', err.message);
  }

  await AppDataSource.destroy();
}

run().catch(console.error);
