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

  @Column({ nullable: true })
  homeFlag: string;

  @Column({ nullable: true })
  awayFlag: string;

  @Column({ nullable: true })
  externalId: number;
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

async function fixTestMatchFlags() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');

    const matchRepo = AppDataSource.getRepository(Match);

    // Find the test match
    const match = await matchRepo.findOne({
      where: { externalId: 1505992 },
    });

    if (!match) {
      console.log('❌ Test match not found');
      process.exit(1);
    }

    console.log('📊 Current flags:');
    console.log(`   Home (${match.homeTeam}): ${match.homeFlag}`);
    console.log(`   Away (${match.awayTeam}): ${match.awayFlag}`);

    // Correct the flags (swap them)
    match.homeFlag = 'https://media.api-sports.io/football/teams/1139.png'; // Deportivo Cali (verde)
    match.awayFlag = 'https://media.api-sports.io/football/teams/1137.png'; // Atlético Nacional (rojo/blanco)

    await matchRepo.save(match);

    console.log('\n✅ Flags corrected!');
    console.log(`   Home (${match.homeTeam}): ${match.homeFlag}`);
    console.log(`   Away (${match.awayTeam}): ${match.awayFlag}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTestMatchFlags();
