import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import * as dotenv from 'dotenv';
import { v5 as uuidv5 } from 'uuid';

dotenv.config();

// Namespace UUID para generar IDs deterministas a partir de strings
// Usamos uno arbitrario para "Polla Mundialista Matches"
const NAMESPACE = '1b671a64-40d5-491e-99b0-da01ff1f3341';

// helper para generar ID determinista
function generateMatchId(phase: string, matchNumber: number): string {
  return uuidv5(`${phase}_MATCH_${matchNumber}`, NAMESPACE);
}

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: ['src/database/entities/*.entity.ts'],
      ssl: false,
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
      entities: ['src/database/entities/*.entity.ts'],
    });

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión establecida para Shells Seeder.');

    const matchesRepo = AppDataSource.getRepository(Match);

    // Definición de las Fases Finales
    const phases = [
      {
        name: 'ROUND_32',
        count: 16,
        startNum: 1,
        baseDate: '2026-06-28T12:00:00Z',
      },
      {
        name: 'ROUND_16',
        count: 8,
        startNum: 17,
        baseDate: '2026-07-04T12:00:00Z',
      },
      {
        name: 'QUARTER',
        count: 4,
        startNum: 25,
        baseDate: '2026-07-09T12:00:00Z',
      },
      {
        name: 'SEMI',
        count: 2,
        startNum: 29,
        baseDate: '2026-07-14T12:00:00Z',
      },
      {
        name: '3RD_PLACE',
        count: 1,
        startNum: 31,
        baseDate: '2026-07-18T12:00:00Z',
      },
      {
        name: 'FINAL',
        count: 1,
        startNum: 32,
        baseDate: '2026-07-19T12:00:00Z',
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const phase of phases) {
      console.log(`\nProcesando Fase: ${phase.name}...`);

      for (let i = 0; i < phase.count; i++) {
        const matchIndex = i + 1;
        const globalMatchNum = phase.startNum + i;
        const matchId = generateMatchId(phase.name, matchIndex);

        // Verificar si ya existe
        const exists = await matchesRepo.findOneBy({ id: matchId });

        if (exists) {
          console.log(
            `   🔸 Match ${phase.name} #${matchIndex} (ID: ${matchId}) ya existe. Saltando.`,
          );
          skippedCount++;
          continue;
        }

        // Crear Cascarón (Shell)
        const match = matchesRepo.create({
          id: matchId,
          phase: phase.name,
          bracketId: globalMatchNum,
          date: new Date(phase.baseDate), // Fecha tentativa
          homeTeam: '', // Empty
          awayTeam: '', // Empty
          homeFlag: '',
          awayFlag: '',
          homeTeamPlaceholder: `Ganador Llave ${globalMatchNum}A`, // Placeholder genérico
          awayTeamPlaceholder: `Ganador Llave ${globalMatchNum}B`,
          status: 'SCHEDULED', // Nuevo estado para indicar "No listo"
          isManuallyLocked: false,
        });

        await matchesRepo.save(match);
        console.log(`   ✅ Creado Shell ${phase.name} #${matchIndex}`);
        createdCount++;
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log(`Resumen Shell Seeder:`);
    console.log(`✅ Creados: ${createdCount}`);
    console.log(`🔸 Omitidos (ya existían): ${skippedCount}`);
    console.log('='.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en Shells Seeder:', error);
    process.exit(1);
  }
}

seed();
