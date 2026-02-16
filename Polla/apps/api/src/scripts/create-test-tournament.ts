import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

@Entity('matches')
class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'WC2026' })
  tournamentId: string;

  @Column()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ nullable: true })
  homeFlag: string;

  @Column({ nullable: true })
  awayFlag: string;

  @Column({ nullable: true })
  group: string;

  @Column({ nullable: true })
  stadium: string;

  @Column({ nullable: true })
  externalId: number;

  @Column({ default: 'PENDING' })
  status: string;
}

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Match],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
      entities: [Match],
      synchronize: false,
    });

async function createTestTournament() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    const matchRepo = AppDataSource.getRepository(Match);

    // Check if test tournament already exists
    const existing = await matchRepo.find({
      where: { tournamentId: 'TEST_LIVE_MONDAY' },
    });

    if (existing.length > 0) {
      console.log('⚠️  TEST_LIVE_MONDAY tournament already exists!');
      console.log(`   Found ${existing.length} match(es).\n`);
      
      existing.forEach((match, index) => {
        console.log(`${index + 1}. ${match.homeTeam} vs ${match.awayTeam}`);
        console.log(`   ID: ${match.id}`);
        console.log(`   External ID: ${match.externalId || 'NOT SET'}`);
        console.log(`   Status: ${match.status}\n`);
      });

      console.log('Delete these matches first or use a different tournament ID.');
      process.exit(1);
    }

    console.log('🏗️  Creating TEST_LIVE_MONDAY tournament...\n');

    // Create placeholder matches
    // User will need to update externalId manually with real fixture IDs
    const testMatches = [
      {
        homeTeam: 'Test Team A',
        awayTeam: 'Test Team B',
        group: 'SYNC TEST 1',
        stadium: 'Test Stadium 1',
      },
      {
        homeTeam: 'Test Team C',
        awayTeam: 'Test Team D',
        group: 'SYNC TEST 2',
        stadium: 'Test Stadium 2',
      },
    ];

    const now = new Date();
    const matchTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    for (const matchData of testMatches) {
      const match = matchRepo.create({
        tournamentId: 'TEST_LIVE_MONDAY',
        homeTeam: matchData.homeTeam,
        awayTeam: matchData.awayTeam,
        date: matchTime,
        homeFlag: 'https://flagcdn.com/w40/xx.png',
        awayFlag: 'https://flagcdn.com/w40/yy.png',
        group: matchData.group,
        stadium: matchData.stadium,
        // externalId is undefined (not set) - must be configured manually
        status: 'SCHEDULED',
      });

      await matchRepo.save(match);
      console.log(`✅ Created: ${match.homeTeam} vs ${match.awayTeam}`);
      console.log(`   ID: ${match.id}`);
      console.log(`   ⚠️  External ID: NOT SET (must be configured manually)\n`);
    }

    console.log('\n🎯 TEST_LIVE_MONDAY Tournament Created!\n');
    console.log('📋 Next Steps:');
    console.log('1. Find real fixture IDs from API-SPORTS (use find-real-time-matches.ts)');
    console.log('2. Update externalId for each match using SQL or a script');
    console.log('3. Navigate to: /dashboard (select TEST_LIVE_MONDAY from dropdown)');
    console.log('\n💡 Tournament Name: ⚙️ System Config (Admin Only)');
    console.log('   (This name will deter regular users from selecting it)');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestTournament();
