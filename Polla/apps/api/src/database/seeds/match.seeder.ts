import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { User } from '../entities/user.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'polla_mundialista',
  entities: [
    Match,
    Prediction,
    User,
    AccessCode,
    LeagueParticipant,
    League,
    Organization,
  ],
  synchronize: false,
});

const matchesData = [
  {
    homeTeam: 'Colombia',
    homeFlag: 'https://flagcdn.com/h80/co.png',
    awayTeam: 'Argentina',
    awayFlag: 'https://flagcdn.com/h80/ar.png',
    date: new Date(), // Hoy
    status: 'SCHEDULED',
  },
  {
    homeTeam: 'Brasil',
    homeFlag: 'https://flagcdn.com/h80/br.png',
    awayTeam: 'Francia',
    awayFlag: 'https://flagcdn.com/h80/fr.png',
    date: new Date(), // Hoy
    status: 'SCHEDULED',
  },
  {
    homeTeam: 'España',
    homeFlag: 'https://flagcdn.com/h80/es.png',
    awayTeam: 'Alemania',
    awayFlag: 'https://flagcdn.com/h80/de.png',
    date: new Date(Date.now() + 86400000), // Mañana
    status: 'SCHEDULED',
  },
  {
    homeTeam: 'USA',
    homeFlag: 'https://flagcdn.com/h80/us.png',
    awayTeam: 'México',
    awayFlag: 'https://flagcdn.com/h80/mx.png',
    date: new Date(Date.now() + 86400000), // Mañana
    status: 'SCHEDULED',
  },
  {
    homeTeam: 'Inglaterra',
    homeFlag: 'https://flagcdn.com/h80/gb-eng.png',
    awayTeam: 'Italia',
    awayFlag: 'https://flagcdn.com/h80/it.png',
    date: new Date(Date.now() + 172800000), // Pasado mañana
    status: 'SCHEDULED',
  },
  {
    homeTeam: 'Portugal',
    homeFlag: 'https://flagcdn.com/h80/pt.png',
    awayTeam: 'Uruguay',
    awayFlag: 'https://flagcdn.com/h80/uy.png',
    date: new Date(Date.now() + 172800000), // Pasado mañana
    status: 'SCHEDULED',
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('Data Source has been initialized!');

    const matchRepository = AppDataSource.getRepository(Match);

    console.log('Cleaning existing matches...');
    // Usamos TRUNCATE CASCADE para borrar partidos y sus predicciones asociadas
    await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');

    console.log('Inserting new matches...');
    for (const matchData of matchesData) {
      const match = matchRepository.create(matchData);
      await matchRepository.save(match);
      console.log(`Created match: ${match.homeTeam} vs ${match.awayTeam}`);
    }

    console.log('Seeding completed successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
}

seed();
