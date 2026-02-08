import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

export async function resetKnockoutStage(
  dataSource: DataSource,
): Promise<void> {
  const matchRepository = dataSource.getRepository(Match);

  console.log('🧹 PASO A: Limpiando fase final (conservando grupos)...');

  // Eliminar todos los partidos que NO sean de fase de grupos
  const deleteResult = await dataSource.query(`
    DELETE FROM matches WHERE phase != 'GROUP' OR phase IS NULL
  `);

  console.log(
    `✅ Eliminados ${deleteResult[1] || 0} partidos de fases finales`,
  );

  console.log(
    '\n🏗️  PASO B: Reconstruyendo Octavos de Final con placeholders FIFA...',
  );

  // Fecha base para los octavos (ajustar según calendario)
  const baseDate = new Date('2026-07-01T16:00:00Z');

  // Partidos de Octavos según formato FIFA oficial
  const knockoutMatches = [
    {
      matchNumber: 49,
      homeTeamPlaceholder: '1A',
      awayTeamPlaceholder: '2B',
      phase: 'ROUND_16',
      bracketId: 1,
      date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000), // Día 1
    },
    {
      matchNumber: 50,
      homeTeamPlaceholder: '1C',
      awayTeamPlaceholder: '2D',
      phase: 'ROUND_16',
      bracketId: 2,
      date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000), // Día 1
    },
    {
      matchNumber: 51,
      homeTeamPlaceholder: '1B',
      awayTeamPlaceholder: '2A',
      phase: 'ROUND_16',
      bracketId: 3,
      date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000), // Día 2
    },
    {
      matchNumber: 52,
      homeTeamPlaceholder: '1D',
      awayTeamPlaceholder: '2C',
      phase: 'ROUND_16',
      bracketId: 4,
      date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000), // Día 2
    },
    {
      matchNumber: 53,
      homeTeamPlaceholder: '1E',
      awayTeamPlaceholder: '2F',
      phase: 'ROUND_16',
      bracketId: 5,
      date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // Día 3
    },
    {
      matchNumber: 54,
      homeTeamPlaceholder: '1G',
      awayTeamPlaceholder: '2H',
      phase: 'ROUND_16',
      bracketId: 6,
      date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000), // Día 3
    },
    {
      matchNumber: 55,
      homeTeamPlaceholder: '1F',
      awayTeamPlaceholder: '2E',
      phase: 'ROUND_16',
      bracketId: 7,
      date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), // Día 4
    },
    {
      matchNumber: 56,
      homeTeamPlaceholder: '1H',
      awayTeamPlaceholder: '2G',
      phase: 'ROUND_16',
      bracketId: 8,
      date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000), // Día 4
    },
  ];

  // Insertar partidos de octavos
  for (const matchData of knockoutMatches) {
    const match = matchRepository.create({
      homeTeam: '',
      awayTeam: '',
      homeTeamPlaceholder: matchData.homeTeamPlaceholder,
      awayTeamPlaceholder: matchData.awayTeamPlaceholder,
      phase: matchData.phase,
      bracketId: matchData.bracketId,
      date: matchData.date,
      status: 'SCHEDULED',
      homeScore: null,
      awayScore: null,
    });
    await matchRepository.save(match);
    console.log(
      `  ✅ Match ${matchData.matchNumber}: ${matchData.homeTeamPlaceholder} vs ${matchData.awayTeamPlaceholder}`,
    );
  }

  console.log(`\n🎉 Reseteo completado exitosamente!`);
  console.log(
    `📊 ${knockoutMatches.length} partidos de Octavos creados con placeholders FIFA`,
  );
}

// Script ejecutable
async function run() {
  console.log('🔌 Conectando a la base de datos...');
  console.log(`Host: ${process.env.DB_HOST}`);
  console.log(`Database: ${process.env.DB_DATABASE}\n`);

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_DATABASE || 'polla_db',
    entities: [Match],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión establecida\n');

    await resetKnockoutStage(dataSource);

    await dataSource.destroy();
    console.log('\n✅ Desconectado de la base de datos');
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
