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

async function injectTestMatch() {
  try {
    // CONFIGURATION - UPDATE THESE VALUES
    const FIXTURE_ID = 0; // ⚠️ SET THIS FROM find-live-matches.ts
    const HOME_TEAM = 'Team A'; // ⚠️ UPDATE
    const AWAY_TEAM = 'Team B'; // ⚠️ UPDATE
    const MATCH_TIME = '2026-02-16T15:00:00Z'; // ⚠️ UPDATE (UTC time)
    const STADIUM = 'Test Stadium'; // ⚠️ UPDATE
    const HOME_FLAG = 'https://flagcdn.com/w40/xx.png'; // ⚠️ UPDATE
    const AWAY_FLAG = 'https://flagcdn.com/w40/yy.png'; // ⚠️ UPDATE

    if (FIXTURE_ID === 0) {
      console.error('❌ ERROR: You must set FIXTURE_ID first!');
      console.error('   Run: npx ts-node apps/api/src/scripts/find-live-matches.ts');
      console.error('   Then update the FIXTURE_ID in this script.');
      process.exit(1);
    }

    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    const matchRepo = AppDataSource.getRepository(Match);

    // Check if match already exists
    const existing = await matchRepo.findOne({
      where: { externalId: FIXTURE_ID },
    });

    if (existing) {
      console.log('⚠️  Match with this externalId already exists!');
      console.log(`   ID: ${existing.id}`);
      console.log(`   Match: ${existing.homeTeam} vs ${existing.awayTeam}`);
      console.log('\n   Delete it first or use a different fixture ID.');
      process.exit(1);
    }

    // Create test match
    const match = matchRepo.create({
      tournamentId: 'UCL2526',
      homeTeam: HOME_TEAM,
      awayTeam: AWAY_TEAM,
      date: new Date(MATCH_TIME),
      homeFlag: HOME_FLAG,
      awayFlag: AWAY_FLAG,
      group: 'TEST SYNC',
      stadium: STADIUM,
      externalId: FIXTURE_ID,
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
    });

    await matchRepo.save(match);

    console.log('✅ Test match injected successfully!\n');
    console.log('📊 Match Details:');
    console.log(`   ID: ${match.id}`);
    console.log(`   External ID: ${match.externalId}`);
    console.log(`   Match: ${match.homeTeam} vs ${match.awayTeam}`);
    console.log(`   Time: ${match.date}`);
    console.log(`   Group: ${match.group}`);
    console.log(`   Stadium: ${match.stadium}`);
    console.log(`\n🔄 The cron job will now sync this match automatically!`);
    console.log(`   Check logs in production for sync activity.`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

injectTestMatch();
