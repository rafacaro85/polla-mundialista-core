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

// Códigos ISO para banderas
const FLAG_CODES: Record<string, string> = {
  Netherlands: 'nl',
  USA: 'us',
  Argentina: 'ar',
  Australia: 'au',
  France: 'fr',
  Poland: 'pl',
  England: 'gb-eng',
  Senegal: 'sn',
  Japan: 'jp',
  Croatia: 'hr',
  Brazil: 'br',
  'South Korea': 'kr',
  Morocco: 'ma',
  Spain: 'es',
  Portugal: 'pt',
  Switzerland: 'ch',
};

function getFlag(team: string): string {
  const code = FLAG_CODES[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
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

    console.log('🏆 Iniciando seed de Octavos de Final con equipos REALES...');

    // Limpiar partidos existentes
    console.log('🗑️  Limpiando partidos anteriores...');
    await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');

    const allMatches: any[] = [];
    let bracketIdCounter = 1;

    // ========================================
    // OCTAVOS DE FINAL (8 partidos con equipos reales)
    // ========================================
    console.log('⚽ Generando Octavos de Final (8 partidos)...');

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    baseDate.setHours(14, 0, 0, 0);

    ROUND_16_REAL.forEach((match, index) => {
      const matchDate = new Date(baseDate);
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
    console.log('   - Octavos de Final: 8 partidos con equipos reales');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
}

seed();
