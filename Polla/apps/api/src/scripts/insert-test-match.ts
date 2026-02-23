import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Inline minimal Match entity
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

  @Column({ type: 'int', nullable: true })
  homeScore: number | null;

  @Column({ type: 'int', nullable: true })
  awayScore: number | null;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ nullable: true })
  homeFlag: string;

  @Column({ nullable: true })
  awayFlag: string;

  @Column({ nullable: true })
  phase: string;

  @Column({ nullable: true })
  group: string;

  @Column({ nullable: true })
  stadium: string;

  @Column({ default: 'PENDING' })
  status: string;

  @Column({ nullable: true })
  externalId: number;

  @Column({ default: false })
  isManuallyLocked: boolean;
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

async function insertTestMatch() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');

    const matchRepo = AppDataSource.getRepository(Match);

    // Check if test match already exists
    const existing = await matchRepo.findOne({
      where: { externalId: 1505992 },
    });

    if (existing) {
      console.log('⚠️  Test match already exists in database:');
      console.log(`   ID: ${existing.id}`);
      console.log(`   ${existing.homeTeam} vs ${existing.awayTeam}`);
      console.log(`   External ID: ${existing.externalId}`);
      console.log(`   Status: ${existing.status}`);
      console.log('\n✅ No action needed.');
      process.exit(0);
    }

    // Create test match
    const testMatch = matchRepo.create({
      tournamentId: 'UCL2526',
      homeTeam: 'Deportivo Cali',
      awayTeam: 'Atlético Nacional',
      homeFlag: 'https://media.api-sports.io/football/teams/1137.png', // Cali logo
      awayFlag: 'https://media.api-sports.io/football/teams/1139.png', // Nacional logo
      date: new Date('2026-02-15T23:30:00Z'), // 18:30 Colombia time
      phase: 'PLAYOFF_1',
      group: 'TEST',
      stadium: 'Estadio Deportivo Cali',
      homeScore: null,
      awayScore: null,
      status: 'SCHEDULED',
      externalId: 1505992, // API-SPORTS fixture ID
      isManuallyLocked: false,
    });

    await matchRepo.save(testMatch);

    console.log('🎉 Test match inserted successfully!');
    console.log(`   ID: ${testMatch.id}`);
    console.log(`   ${testMatch.homeTeam} vs ${testMatch.awayTeam}`);
    console.log(`   External ID: ${testMatch.externalId}`);
    console.log(`   Date: ${testMatch.date}`);
    console.log(`   Tournament: ${testMatch.tournamentId}`);
    console.log(
      '\n✅ The match should now appear in UCL2526 tournament cards!',
    );
    console.log('✅ Live sync will work automatically when the match starts.');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

insertTestMatch();
