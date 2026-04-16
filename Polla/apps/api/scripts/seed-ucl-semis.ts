import { DataSource } from 'typeorm';
import { Match } from '../src/database/entities/match.entity';
import { KnockoutPhaseStatus } from '../src/database/entities/knockout-phase-status.entity';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Cargar variables de entorno
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Match, KnockoutPhaseStatus],
  synchronize: false,
  ssl: { rejectUnauthorized: false },
});

const SEMI_MATCHES = [
  // Ida
  {
    date: '2026-04-28T19:00:00Z', // Mar 28/4 2:00 p.m. COT
    home: 'PSG',
    away: 'Bayern Munich',
    homeFlag: 'https://crests.football-data.org/524.svg',
    awayFlag: 'https://crests.football-data.org/5.svg',
    group: 'LEG_1', 
    bracketId: 101,
  },
  {
    date: '2026-04-29T19:00:00Z', // Mié 29/4 2:00 p.m. COT
    home: 'Atletico Madrid',
    away: 'Arsenal',
    homeFlag: 'https://crests.football-data.org/78.svg',
    awayFlag: 'https://crests.football-data.org/57.svg',
    group: 'LEG_1', 
    bracketId: 102,
  },
  // Vuelta
  {
    date: '2026-05-05T19:00:00Z', // 5/5 2:00 p.m. COT
    home: 'Arsenal',
    away: 'Atletico Madrid',
    homeFlag: 'https://crests.football-data.org/57.svg',
    awayFlag: 'https://crests.football-data.org/78.svg',
    group: 'LEG_2', 
    bracketId: 102,
  },
  {
    date: '2026-05-06T19:00:00Z', // 6/5 2:00 p.m. COT
    home: 'Bayern Munich',
    away: 'PSG',
    homeFlag: 'https://crests.football-data.org/5.svg',
    awayFlag: 'https://crests.football-data.org/524.svg',
    group: 'LEG_2', 
    bracketId: 101,
  }
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida.');

    const matchRepo = AppDataSource.getRepository(Match);
    const phaseStatusRepo = AppDataSource.getRepository(KnockoutPhaseStatus);
    const tournamentId = 'UCL2526';
    const currentPhase = 'SEMI';

    // 1. Asegurar que QUARTER está completada y desbloqueada, y SEMI desbloqueada
    console.log('🔓 Habilitando fases Semifinal y garantizando cierre de Cuartos...');
    await phaseStatusRepo.upsert(
      { phase: 'QUARTER', tournamentId, isUnlocked: true, allMatchesCompleted: true },
      ['phase', 'tournamentId']
    );
    await phaseStatusRepo.upsert(
      { phase: 'SEMI', tournamentId, isUnlocked: true, unlockedAt: new Date(), allMatchesCompleted: false },
      ['phase', 'tournamentId']
    );

    // 2. Insertar los partidos si no existen (evitar duplicados)
    console.log('⚽ Insertando partidos exactos de Semifinales con sus fechas...');
    let inserted = 0;
    
    for (const matchData of SEMI_MATCHES) {
      const exists = await matchRepo.findOne({
        where: {
          homeTeam: matchData.home,
          awayTeam: matchData.away,
          phase: currentPhase,
          tournamentId,
        }
      });

      if (!exists) {
        const match = matchRepo.create({
          homeTeam: matchData.home,
          awayTeam: matchData.away,
          homeFlag: matchData.homeFlag,
          awayFlag: matchData.awayFlag,
          date: new Date(matchData.date),
          group: matchData.group,
          phase: currentPhase,
          bracketId: matchData.bracketId,
          tournamentId: tournamentId,
          status: 'SCHEDULED', // Programado para que no cause errores de sincronización
        });
        await matchRepo.save(match);
        inserted++;
        console.log(`   (+) Creado: ${matchData.home} vs ${matchData.away} (${matchData.date})`);
      } else {
        console.log(`   (=) Ya existe: ${matchData.home} vs ${matchData.away}`);
      }
    }

    console.log(`\n🎉 Script completado: Se insertaron ${inserted} partidos nuevos de Semifinales y se habilitó la fase.`);
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seed();
