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

// Grupos del Mundial Qatar 2022
const GROUPS = {
  A: ['Qatar', 'Ecuador', 'Senegal', 'Netherlands'],
  B: ['England', 'Iran', 'USA', 'Wales'],
  C: ['Argentina', 'Saudi Arabia', 'Mexico', 'Poland'],
  D: ['France', 'Australia', 'Denmark', 'Tunisia'],
  E: ['Spain', 'Costa Rica', 'Germany', 'Japan'],
  F: ['Belgium', 'Canada', 'Morocco', 'Croatia'],
  G: ['Brazil', 'Serbia', 'Switzerland', 'Cameroon'],
  H: ['Portugal', 'Ghana', 'Uruguay', 'South Korea'],
};

// Códigos ISO para banderas
const FLAG_CODES: Record<string, string> = {
  Qatar: 'qa',
  Ecuador: 'ec',
  Senegal: 'sn',
  Netherlands: 'nl',
  England: 'gb-eng',
  Iran: 'ir',
  USA: 'us',
  Wales: 'gb-wls',
  Argentina: 'ar',
  'Saudi Arabia': 'sa',
  Mexico: 'mx',
  Poland: 'pl',
  France: 'fr',
  Australia: 'au',
  Denmark: 'dk',
  Tunisia: 'tn',
  Spain: 'es',
  'Costa Rica': 'cr',
  Germany: 'de',
  Japan: 'jp',
  Belgium: 'be',
  Canada: 'ca',
  Morocco: 'ma',
  Croatia: 'hr',
  Brazil: 'br',
  Serbia: 'rs',
  Switzerland: 'ch',
  Cameroon: 'cm',
  Portugal: 'pt',
  Ghana: 'gh',
  Uruguay: 'uy',
  'South Korea': 'kr',
};

function getFlag(team: string): string {
  const code = FLAG_CODES[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
}

// Generar partidos de fase de grupos
function generateGroupMatches(
  group: string,
  teams: string[],
  startDate: Date,
): any[] {
  const matches: any[] = [];
  const pairings = [
    [0, 1],
    [2, 3],
    [0, 2],
    [1, 3],
    [0, 3],
    [1, 2],
  ];

  pairings.forEach((pair, index) => {
    const matchDate = new Date(startDate);
    matchDate.setHours(matchDate.getHours() + index * 4);

    matches.push({
      homeTeam: teams[pair[0]],
      awayTeam: teams[pair[1]],
      homeFlag: getFlag(teams[pair[0]]),
      awayFlag: getFlag(teams[pair[1]]),
      phase: 'GROUP',
      group: group,
      status: 'PENDING',
      date: matchDate,
      homeScore: null,
      awayScore: null,
    });
  });

  return matches;
}

// Octavos de Final REALES de Qatar 2022
const ROUND_16_REAL = [
  { home: 'Netherlands', away: 'USA' },
  { home: 'Argentina', away: 'Australia' },
  { home: 'France', away: 'Poland' },
  { home: 'England', away: 'Senegal' },
  { home: 'Japan', away: 'Croatia' },
  { home: 'Brazil', away: 'South Korea' },
  { home: 'Morocco', away: 'Spain' },
  { home: 'Portugal', away: 'Switzerland' },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    const matchRepository = AppDataSource.getRepository(Match);

    console.log('🏆 Iniciando seed COMPLETO (Grupos + Octavos)...');

    // Limpiar partidos existentes
    console.log('🗑️  Limpiando partidos anteriores...');
    await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');

    const allMatches: any[] = [];
    let bracketIdCounter = 1;

    // ========================================
    // FASE DE GRUPOS (48 partidos)
    // ========================================
    console.log('⚽ Generando Fase de Grupos (48 partidos)...');

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    baseDate.setHours(12, 0, 0, 0);

    Object.entries(GROUPS).forEach(([groupLetter, teams], groupIndex) => {
      const groupDate = new Date(baseDate);
      groupDate.setDate(groupDate.getDate() + groupIndex);

      const groupMatches = generateGroupMatches(groupLetter, teams, groupDate);
      allMatches.push(...groupMatches);

      console.log(`   ✓ Grupo ${groupLetter}: ${groupMatches.length} partidos`);
    });

    // ========================================
    // OCTAVOS DE FINAL (8 partidos con equipos reales)
    // ========================================
    console.log('🏆 Generando Octavos de Final (8 partidos)...');

    const round16Date = new Date(baseDate);
    round16Date.setDate(round16Date.getDate() + 10);
    round16Date.setHours(14, 0, 0, 0);

    ROUND_16_REAL.forEach((match, index) => {
      const matchDate = new Date(round16Date);
      matchDate.setHours(matchDate.getHours() + index * 6);

      allMatches.push({
        homeTeam: match.home,
        awayTeam: match.away,
        homeFlag: getFlag(match.home),
        awayFlag: getFlag(match.away),
        phase: 'ROUND_16',
        bracketId: bracketIdCounter++,
        status: 'PENDING',
        date: matchDate,
        homeScore: null,
        awayScore: null,
      });
    });

    // ========================================
    // GUARDAR EN BASE DE DATOS
    // ========================================
    console.log('💾 Guardando partidos en la base de datos...');

    for (const matchData of allMatches) {
      const match = matchRepository.create(matchData);
      await matchRepository.save(match);
    }

    console.log('✅ Seed completado exitosamente!');
    console.log(`📊 Total de partidos creados: ${allMatches.length}`);
    console.log('   - Fase de Grupos: 48 partidos');
    console.log('   - Octavos de Final: 8 partidos');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
}

seed();
