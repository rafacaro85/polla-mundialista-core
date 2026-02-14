import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// INLINED ENTITY TO AVOID MODULE RESOLUTION ISSUES
@Entity('matches')
export class Match {
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
  phase: string;
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

// Map Logic Name -> Filename in /images/escudos/
const FLAG_UPDATES: Record<string, string> = {
  'Real Madrid': '/images/escudos/real-madrid-footballlogos-org.svg',
  'Benfica': '/images/escudos/sl-benfica-footballlogos-org.svg',
  'Juventus': '/images/escudos/juventus-footballlogos-org.svg',
  'Atletico Madrid': '/images/escudos/atletico-madrid-footballlogos-org.svg',
  'Atlético Madrid': '/images/escudos/atletico-madrid-footballlogos-org.svg', // Found in DB
  'Bayer Leverkusen': '/images/escudos/bayer-leverkusen-footballlogos-org.svg',
  'Inter Milan': '/images/escudos/inter-milan-footballlogos-org.svg',
  'Borussia Dortmund': '/images/escudos/borussia-dortmund-footballlogos-org.svg',
  'Dortmund': '/images/escudos/borussia-dortmund-footballlogos-org.svg', // Found in DB
  'PSG': '/images/escudos/paris-saint-germain-footballlogos-org.svg',
  'Atalanta': '/images/escudos/atalanta-footballlogos-org.svg',
  'Monaco': '/images/escudos/as-monaco-footballlogos-org.svg',
  'Bodo/Glimt': '/images/escudos/bodo-glimt-footballlogos-org.svg', 
  'Club Brugge': '/images/escudos/club-brugge-footballlogos-org.svg', 
  'Club Brujas': '/images/escudos/club-brugge-footballlogos-org.svg', // Likely in DB if spanish
  'Galatasaray': '/images/escudos/galatasaray-footballlogos-org.svg',
  'Newcastle': '/images/escudos/newcastle-united-footballlogos-org.svg',
  'Olympiacos': '/images/escudos/olympiacos-footballlogos-org.svg', 
  'Qarabag': '/images/escudos/qarabag-fk-footballlogos-org.svg', 
};

async function updateFlags() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to DB');

    const matchRepo = AppDataSource.getRepository(Match);
    
    console.log('🔄 Updating flags for UCL2526...');
    
    for (const [teamName, flagUrl] of Object.entries(FLAG_UPDATES)) {
      // Update Home
      const updateHome = await matchRepo.createQueryBuilder()
        .update(Match)
        .set({ homeFlag: flagUrl })
        .where("homeTeam = :team", { team: teamName })
        .andWhere("tournamentId = 'UCL2526'")
        .execute();

      // Update Away
      const updateAway = await matchRepo.createQueryBuilder()
        .update(Match)
        .set({ awayFlag: flagUrl })
        .where("awayTeam = :team", { team: teamName })
        .andWhere("tournamentId = 'UCL2526'")
        .execute();

      if (updateHome.affected || updateAway.affected) {
        console.log(`✅ Updated ${teamName} -> ${flagUrl} (Matches affected: ${(updateHome.affected || 0) + (updateAway.affected || 0)})`);
      } else {
        console.log(`⚠️ Team not found in UCL2526 matches: ${teamName}`);
      }
    }

    console.log('🎉 Done.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

updateFlags();
