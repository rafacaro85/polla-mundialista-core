import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

@Entity('matches')
class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ nullable: true })
  group: string;

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

async function fixTestMatchDisplay() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');

    const matchRepo = AppDataSource.getRepository(Match);

    const match = await matchRepo.findOne({
      where: { externalId: 1505992 },
    });

    if (!match) {
      console.log('❌ Test match not found');
      process.exit(1);
    }

    console.log('📊 Current values:');
    console.log(`   Date: ${match.date}`);
    console.log(`   Group: ${match.group}`);

    // Update to correct time and label
    match.date = new Date('2026-02-15T23:30:00Z'); // 18:30 Colombia time
    match.group = 'PARTIDO DE PRUEBA';

    await matchRepo.save(match);

    console.log('\n✅ Test match updated!');
    console.log(`   New Date: ${match.date} (18:30 Colombia time)`);
    console.log(`   New Label: ${match.group}`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixTestMatchDisplay();
