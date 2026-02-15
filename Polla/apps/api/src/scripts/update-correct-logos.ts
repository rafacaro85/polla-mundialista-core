import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

@Entity('matches')
class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

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

async function updateCorrectLogos() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');

    const matchRepo = AppDataSource.getRepository(Match);

    const match = await matchRepo.findOne({
      where: { externalId: 1505992 },
    });

    if (!match) {
      console.log('❌ Match not found');
      process.exit(1);
    }

    // Update with correct logos from API
    match.homeFlag = 'https://media.api-sports.io/football/teams/1127.png'; // Deportivo Cali
    match.awayFlag = 'https://media.api-sports.io/football/teams/1137.png'; // Atlético Nacional

    await matchRepo.save(match);

    console.log('✅ Logos updated successfully!');
    console.log(`   Home (Deportivo Cali): ${match.homeFlag}`);
    console.log(`   Away (Atlético Nacional): ${match.awayFlag}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateCorrectLogos();
