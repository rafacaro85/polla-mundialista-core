import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';

import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Match,
      ],
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
      entities: [
        Match,
      ],
      synchronize: false,
    });

// Champions League Teams (Round of 16 - 2025/26 Projection based on top teams)
const TEAMS: Record<string, string> = {
  'Manchester City': 'gb-eng',
  'Real Madrid': 'es',
  'Bayern Munich': 'de',
  Liverpool: 'gb-eng',
  'Inter Milan': 'it',
  Arsenal: 'gb-eng',
  Barcelona: 'es',
  PSG: 'fr',
  'Atletico Madrid': 'es',
  'Borussia Dortmund': 'de',
  'Bayer Leverkusen': 'de',
  Juventus: 'it',
  'AC Milan': 'it',
  Benfica: 'pt',
  'Aston Villa': 'gb-eng',
  PSV: 'nl',
};

function getLogo(team: string): string {
  const code = TEAMS[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
}

// Constante HARDCODEADA para seguridad
const TARGET_TOURNAMENT_ID = 'UCL2526';

// Round of 16 Matches (Ida and Vuelta)
const MATCHES = [
  // IDA (Feb 17-18, 24-25 2026)
  {
    date: '2026-02-17T20:00:00Z',
    home: 'PSV',
    away: 'Arsenal',
    group: 'R16',
    stadium: 'Philips Stadion',
  },
  {
    date: '2026-02-17T20:00:00Z',
    home: 'Benfica',
    away: 'Real Madrid',
    group: 'R16',
    stadium: 'Estádio da Luz',
  },
  {
    date: '2026-02-18T20:00:00Z',
    home: 'Juventus',
    away: 'Manchester City',
    group: 'R16',
    stadium: 'Allianz Stadium',
  },
  {
    date: '2026-02-18T20:00:00Z',
    home: 'AC Milan',
    away: 'Liverpool',
    group: 'R16',
    stadium: 'San Siro',
  },
  {
    date: '2026-02-24T20:00:00Z',
    home: 'Atletico Madrid',
    away: 'Bayern Munich',
    group: 'R16',
    stadium: 'Metropolitano',
  },
  {
    date: '2026-02-24T20:00:00Z',
    home: 'Bayer Leverkusen',
    away: 'Inter Milan',
    group: 'R16',
    stadium: 'BayArena',
  },
  {
    date: '2026-02-25T20:00:00Z',
    home: 'Aston Villa',
    away: 'Barcelona',
    group: 'R16',
    stadium: 'Villa Park',
  },
  {
    date: '2026-02-25T20:00:00Z',
    home: 'Borussia Dortmund',
    away: 'PSG',
    group: 'R16',
    stadium: 'Signal Iduna Park',
  },

  // VUELTA (Mar 10-11, 17-18 2026)
  {
    date: '2026-03-10T20:00:00Z',
    home: 'Arsenal',
    away: 'PSV',
    group: 'R16',
    stadium: 'Emirates Stadium',
  },
  {
    date: '2026-03-10T20:00:00Z',
    home: 'Real Madrid',
    away: 'Benfica',
    group: 'R16',
    stadium: 'Santiago Bernabéu',
  },
  {
    date: '2026-03-11T20:00:00Z',
    home: 'Manchester City',
    away: 'Juventus',
    group: 'R16',
    stadium: 'Etihad Stadium',
  },
  {
    date: '2026-03-11T20:00:00Z',
    home: 'Liverpool',
    away: 'AC Milan',
    group: 'R16',
    stadium: 'Anfield',
  },
  {
    date: '2026-03-17T20:00:00Z',
    home: 'Bayern Munich',
    away: 'Atletico Madrid',
    group: 'R16',
    stadium: 'Allianz Arena',
  },
  {
    date: '2026-03-17T20:00:00Z',
    home: 'Inter Milan',
    away: 'Bayer Leverkusen',
    group: 'R16',
    stadium: 'San Siro',
  },
  {
    date: '2026-03-18T20:00:00Z',
    home: 'Barcelona',
    away: 'Aston Villa',
    group: 'R16',
    stadium: 'Camp Nou',
  },
  {
    date: '2026-03-18T20:00:00Z',
    home: 'PSG',
    away: 'Borussia Dortmund',
    group: 'R16',
    stadium: 'Parc des Princes',
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a DB establecida para INYECCIÓN QUIRÚRGICA');

    const matchRepository = AppDataSource.getRepository(Match);

    // 1. Safety Check: Verificar si ya existen partidos de UCL para no duplicar
    const existingCount = await matchRepository.count({
      where: { tournamentId: TARGET_TOURNAMENT_ID }
    });

    if (existingCount > 0) {
      console.warn(`⚠️  ALERTA: Ya existen ${existingCount} partidos con ID ${TARGET_TOURNAMENT_ID}.`);
      console.warn('⚠️  Abortando script para evitar duplicados. Si deseas reiniciar, borra manualmente los partidos de UCL.');
      process.exit(0);
    }

    console.log(`🌍 Iniciando inyección de ${MATCHES.length} partidos para ${TARGET_TOURNAMENT_ID}...`);

    let insertedCount = 0;

    for (const matchData of MATCHES) {
      const match = matchRepository.create({
        tournamentId: TARGET_TOURNAMENT_ID, // 🔒 LOCK IN TOURNAMENT ID
        homeTeam: matchData.home,
        awayTeam: matchData.away,
        homeFlag: getLogo(matchData.home),
        awayFlag: getLogo(matchData.away),
        date: new Date(matchData.date),
        group: matchData.group,
        phase: 'ROUND_16',
        stadium: matchData.stadium,
        homeScore: null,
        awayScore: null,
        status: 'SCHEDULED',
        isManuallyLocked: false,
      });

      await matchRepository.save(match);
      insertedCount++;
      // console.log(`✅ [${TARGET_TOURNAMENT_ID}] Insertado: ${matchData.home} vs ${matchData.away}`);
    }

    console.log(`\n🎉 INYECCIÓN COMPLETADA. Se agregaron ${insertedCount} partidos al torneo ${TARGET_TOURNAMENT_ID}.`);
    console.log('🔒 Los datos de WC2026 permanecen intactos.');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error Crítico en Data Injection:', error);
    process.exit(1);
  }
}

seed();
