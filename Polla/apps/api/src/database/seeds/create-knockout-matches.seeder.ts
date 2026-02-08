import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { User } from '../entities/user.entity';
import { UserBracket } from '../entities/user-bracket.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno desde el archivo .env en la raíz del proyecto
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export async function seedKnockoutStage(dataSource: DataSource): Promise<void> {
  const matchRepository = dataSource.getRepository(Match);

  console.log('🌱 Seeding knockout stage matches...');

  // Fecha base: 2 días después del último partido de grupos (ajustar según tu calendario)
  const baseDate = new Date('2026-07-01T16:00:00Z');

  const knockoutMatches = [
    // OCTAVOS DE FINAL (Round of 16)
    {
      homeTeamPlaceholder: '1A',
      awayTeamPlaceholder: '2B',
      phase: 'ROUND_16',
      bracketId: 1,
      date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000), // Día 1
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1C',
      awayTeamPlaceholder: '2D',
      phase: 'ROUND_16',
      bracketId: 2,
      date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1E',
      awayTeamPlaceholder: '2F',
      phase: 'ROUND_16',
      bracketId: 3,
      date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000), // Día 2
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1G',
      awayTeamPlaceholder: '2H',
      phase: 'ROUND_16',
      bracketId: 4,
      date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1B',
      awayTeamPlaceholder: '2A',
      phase: 'ROUND_16',
      bracketId: 5,
      date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // Día 3
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1D',
      awayTeamPlaceholder: '2C',
      phase: 'ROUND_16',
      bracketId: 6,
      date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1F',
      awayTeamPlaceholder: '2E',
      phase: 'ROUND_16',
      bracketId: 7,
      date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), // Día 4
      status: 'PENDING',
    },
    {
      homeTeamPlaceholder: '1H',
      awayTeamPlaceholder: '2G',
      phase: 'ROUND_16',
      bracketId: 8,
      date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
      status: 'PENDING',
    },
  ];

  // Verificar si ya existen partidos de octavos
  const existingKnockout = await matchRepository.count({
    where: { phase: 'ROUND_16' },
  });

  if (existingKnockout > 0) {
    console.log(
      `⚠️  Found ${existingKnockout} existing ROUND_16 matches. Skipping seeding.`,
    );
    return;
  }

  // Insertar partidos
  for (const matchData of knockoutMatches) {
    const match = matchRepository.create({
      ...matchData,
      homeTeam: '', // Vacío hasta que se promocione
      awayTeam: '',
      homeScore: null,
      awayScore: null,
    });
    await matchRepository.save(match);
  }

  console.log(
    `✅ Successfully seeded ${knockoutMatches.length} knockout stage matches!`,
  );
}

// Script ejecutable
async function run() {
  console.log('🔌 Connecting to database...');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Port: ${process.env.DB_PORT}`);
  console.log(`Database: ${process.env.DB_DATABASE}`);
  console.log(`Username: ${process.env.DB_USERNAME}`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'polla_db',
    entities: [Match, Prediction, User, UserBracket], // Incluir todas las entidades relacionadas
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connected!');

    await seedKnockoutStage(dataSource);

    await dataSource.destroy();
    console.log('🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Ejecutar solo si es el script principal
if (require.main === module) {
  run();
}
