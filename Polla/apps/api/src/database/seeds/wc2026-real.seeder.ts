import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { User } from '../entities/user.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import { Notification } from '../entities/notification.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Match,
        Prediction,
        User,
        AccessCode,
        LeagueParticipant,
        League,
        Organization,
        Notification,
      ],
      synchronize: false,
      ssl: { rejectUnauthorized: false }, // Fix for Railway SSL
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
        Prediction,
        User,
        AccessCode,
        LeagueParticipant,
        League,
        Organization,
        Notification,
      ],
      synchronize: false,
    });

// Códigos ISO para banderas
// Códigos ISO para banderas
const FLAG_CODES: Record<string, string> = {
  México: 'mx',
  Sudáfrica: 'za',
  'República de Corea': 'kr',
  Canadá: 'ca',
  Italia: 'it',
  'Estados Unidos': 'us',
  Paraguay: 'py',
  Catar: 'qa',
  Suiza: 'ch',
  Brasil: 'br',
  Marruecos: 'ma',
  Haití: 'ht',
  Escocia: 'gb-sct',
  Australia: 'au',
  Alemania: 'de',
  Curazao: 'cw',
  'Países Bajos': 'nl',
  Japón: 'jp',
  'Costa del Marfil': 'ci',
  Ecuador: 'ec',
  Túnez: 'tn',
  España: 'es',
  'Cabo Verde': 'cv',
  Bélgica: 'be',
  Egipto: 'eg',
  'Arabia Saudí': 'sa',
  Uruguay: 'uy',
  Irán: 'ir',
  'Nueva Zelanda': 'nz',
  Francia: 'fr',
  Senegal: 'sn',
  Noruega: 'no',
  Argentina: 'ar',
  Argelia: 'dz',
  Austria: 'at',
  Jordania: 'jo',
  Portugal: 'pt',
  Inglaterra: 'gb-eng',
  Croacia: 'hr',
  Ghana: 'gh',
  Panamá: 'pa',
  Uzbekistán: 'uz',
  Colombia: 'co',
  Dinamarca: 'dk',
  // Equipos de Repechaje (Prueba)
  Chile: 'cl',
  Suecia: 'se',
  Perú: 'pe',
  Gales: 'gb-wls',
  Polonia: 'pl',
  'Costa Rica': 'cr',
};

function getFlag(team: string): string {
  const code = FLAG_CODES[team];
  return code ? `https://flagcdn.com/w40/${code}.png` : '';
}

// Partidos reales del Mundial 2026 - Fase de Grupos
const REAL_MATCHES = [
  // Jueves, 11 de junio 2026
  {
    date: '2026-06-11T19:00:00Z',
    home: 'México',
    away: 'Sudáfrica',
    group: 'A',
    stadium: 'Estadio Ciudad de México',
  },
  {
    date: '2026-06-12T02:00:00Z',
    home: 'República de Corea',
    away: 'PLA_A',
    group: 'A',
    stadium: 'Estadio Guadalajara',
  },

  // Viernes, 12 de junio 2026
  {
    date: '2026-06-12T19:00:00Z',
    home: 'Canadá',
    away: 'PLA_B',
    group: 'B',
    stadium: 'Toronto Stadium',
  },
  {
    date: '2026-06-13T01:00:00Z',
    home: 'Estados Unidos',
    away: 'Paraguay',
    group: 'D',
    stadium: 'Los Angeles Stadium',
  },

  // Sábado, 13 de junio 2026
  {
    date: '2026-06-13T19:00:00Z',
    home: 'Catar',
    away: 'Suiza',
    group: 'B',
    stadium: 'San Francisco Bay Area Stadium',
  },
  {
    date: '2026-06-13T22:00:00Z',
    home: 'Brasil',
    away: 'Marruecos',
    group: 'C',
    stadium: 'Nueva York Nueva Jersey Stadium',
  },
  {
    date: '2026-06-14T01:00:00Z',
    home: 'Haití',
    away: 'Escocia',
    group: 'C',
    stadium: 'Boston Stadium',
  },
  {
    date: '2026-06-14T04:00:00Z',
    home: 'Australia',
    away: 'PLA_C',
    group: 'D',
    stadium: 'BC Place Vancouver',
  },

  // Domingo, 14 de junio 2026
  {
    date: '2026-06-14T17:00:00Z',
    home: 'Alemania',
    away: 'Curazao',
    group: 'E',
    stadium: 'Houston Stadium',
  },
  {
    date: '2026-06-14T20:00:00Z',
    home: 'Países Bajos',
    away: 'Japón',
    group: 'F',
    stadium: 'Dallas Stadium',
  },
  {
    date: '2026-06-14T23:00:00Z',
    home: 'Costa del Marfil',
    away: 'Ecuador',
    group: 'E',
    stadium: 'Philadelphia Stadium',
  },
  {
    date: '2026-06-15T02:00:00Z',
    home: 'PLA_D',
    away: 'Túnez',
    group: 'F',
    stadium: 'Estadio Monterrey',
  },

  // Lunes, 15 de junio 2026
  {
    date: '2026-06-15T16:00:00Z',
    home: 'España',
    away: 'Cabo Verde',
    group: 'H',
    stadium: 'Atlanta Stadium',
  },
  {
    date: '2026-06-15T19:00:00Z',
    home: 'Bélgica',
    away: 'Egipto',
    group: 'G',
    stadium: 'Seattle Stadium',
  },
  {
    date: '2026-06-15T22:00:00Z',
    home: 'Arabia Saudí',
    away: 'Uruguay',
    group: 'H',
    stadium: 'Miami Stadium',
  },
  {
    date: '2026-06-16T01:00:00Z',
    home: 'Irán',
    away: 'Nueva Zelanda',
    group: 'G',
    stadium: 'Los Angeles Stadium',
  },

  // Martes, 16 de junio 2026
  {
    date: '2026-06-16T19:00:00Z',
    home: 'Francia',
    away: 'Senegal',
    group: 'I',
    stadium: 'New York New Jersey Stadium',
  },
  {
    date: '2026-06-16T22:00:00Z',
    home: 'PLA_E',
    away: 'Noruega',
    group: 'I',
    stadium: 'Boston Stadium',
  },
  {
    date: '2026-06-17T01:00:00Z',
    home: 'Argentina',
    away: 'Argelia',
    group: 'J',
    stadium: 'Kansas City Stadium',
  },
  {
    date: '2026-06-17T04:00:00Z',
    home: 'Austria',
    away: 'Jordania',
    group: 'J',
    stadium: 'San Francisco Bay Area Stadium',
  },

  // Miércoles, 17 de junio 2026
  {
    date: '2026-06-17T17:00:00Z',
    home: 'Portugal',
    away: 'PLA_F',
    group: 'K',
    stadium: 'Houston Stadium',
  },
  {
    date: '2026-06-17T20:00:00Z',
    home: 'Inglaterra',
    away: 'Croacia',
    group: 'L',
    stadium: 'Dallas Stadium',
  },
  {
    date: '2026-06-17T23:00:00Z',
    home: 'Ghana',
    away: 'Panamá',
    group: 'L',
    stadium: 'Toronto Stadium',
  },
  {
    date: '2026-06-18T02:00:00Z',
    home: 'Uzbekistán',
    away: 'Colombia',
    group: 'K',
    stadium: 'Estadio Ciudad de México',
  },

  // Jueves, 18 de junio 2026
  {
    date: '2026-06-18T16:00:00Z',
    home: 'PLA_A',
    away: 'Sudáfrica',
    group: 'A',
    stadium: 'Atlanta Stadium',
  },
  {
    date: '2026-06-18T19:00:00Z',
    home: 'Suiza',
    away: 'PLA_B',
    group: 'B',
    stadium: 'Los Angeles Stadium',
  },
  {
    date: '2026-06-18T22:00:00Z',
    home: 'Canadá',
    away: 'Catar',
    group: 'B',
    stadium: 'BC Place Vancouver',
  },
  {
    date: '2026-06-19T01:00:00Z',
    home: 'México',
    away: 'República de Corea',
    group: 'A',
    stadium: 'Estadio Guadalajara',
  },

  // Viernes, 19 de junio 2026
  {
    date: '2026-06-19T19:00:00Z',
    home: 'Estados Unidos',
    away: 'Australia',
    group: 'D',
    stadium: 'Seattle Stadium',
  },
  {
    date: '2026-06-19T22:00:00Z',
    home: 'Escocia',
    away: 'Marruecos',
    group: 'C',
    stadium: 'Boston Stadium',
  },
  {
    date: '2026-06-20T01:00:00Z',
    home: 'Brasil',
    away: 'Haití',
    group: 'C',
    stadium: 'Philadelphia Stadium',
  },
  {
    date: '2026-06-20T04:00:00Z',
    home: 'PLA_C',
    away: 'Paraguay',
    group: 'D',
    stadium: 'San Francisco Bay Area Stadium',
  },

  // Sábado, 20 de junio 2026
  {
    date: '2026-06-20T17:00:00Z',
    home: 'Países Bajos',
    away: 'PLA_D',
    group: 'F',
    stadium: 'Houston Stadium',
  },
  {
    date: '2026-06-20T20:00:00Z',
    home: 'Alemania',
    away: 'Costa del Marfil',
    group: 'E',
    stadium: 'Toronto Stadium',
  },
  {
    date: '2026-06-21T02:00:00Z',
    home: 'Ecuador',
    away: 'Curazao',
    group: 'E',
    stadium: 'Kansas City Stadium',
  },
  {
    date: '2026-06-21T04:00:00Z',
    home: 'Túnez',
    away: 'Japón',
    group: 'F',
    stadium: 'Estadio Monterrey',
  },

  // Domingo, 21 de junio 2026
  {
    date: '2026-06-21T16:00:00Z',
    home: 'España',
    away: 'Arabia Saudí',
    group: 'H',
    stadium: 'Atlanta Stadium',
  },
  {
    date: '2026-06-21T19:00:00Z',
    home: 'Bélgica',
    away: 'Irán',
    group: 'G',
    stadium: 'Los Angeles Stadium',
  },
  {
    date: '2026-06-21T22:00:00Z',
    home: 'Uruguay',
    away: 'Cabo Verde',
    group: 'H',
    stadium: 'Miami Stadium',
  },
  {
    date: '2026-06-22T01:00:00Z',
    home: 'Nueva Zelanda',
    away: 'Egipto',
    group: 'G',
    stadium: 'BC Place Vancouver',
  },

  // Lunes, 22 de junio 2026
  {
    date: '2026-06-22T17:00:00Z',
    home: 'Argentina',
    away: 'Austria',
    group: 'J',
    stadium: 'Dallas Stadium',
  },
  {
    date: '2026-06-22T21:00:00Z',
    home: 'Francia',
    away: 'PLA_E',
    group: 'I',
    stadium: 'Philadelphia Stadium',
  },
  {
    date: '2026-06-23T00:00:00Z',
    home: 'Noruega',
    away: 'Senegal',
    group: 'I',
    stadium: 'Nueva York Nueva Jersey Stadium',
  },
  {
    date: '2026-06-23T03:00:00Z',
    home: 'Jordania',
    away: 'Argelia',
    group: 'J',
    stadium: 'San Francisco Bay Area Stadium',
  },

  // Martes, 23 de junio 2026
  {
    date: '2026-06-23T17:00:00Z',
    home: 'Portugal',
    away: 'Uzbekistán',
    group: 'K',
    stadium: 'Houston Stadium',
  },
  {
    date: '2026-06-23T20:00:00Z',
    home: 'Inglaterra',
    away: 'Ghana',
    group: 'L',
    stadium: 'Boston Stadium',
  },
  {
    date: '2026-06-23T23:00:00Z',
    home: 'Panamá',
    away: 'Croacia',
    group: 'L',
    stadium: 'Toronto Stadium',
  },
  {
    date: '2026-06-24T02:00:00Z',
    home: 'Colombia',
    away: 'PLA_F',
    group: 'K',
    stadium: 'Estadio Guadalajara',
  },

  // Miércoles, 24 de junio 2026
  {
    date: '2026-06-24T19:00:00Z',
    home: 'Suiza',
    away: 'Canadá',
    group: 'B',
    stadium: 'BC Place Vancouver',
  },
  {
    date: '2026-06-24T19:00:00Z',
    home: 'PLA_B',
    away: 'Catar',
    group: 'B',
    stadium: 'Seattle Stadium',
  },
  {
    date: '2026-06-24T22:00:00Z',
    home: 'Brasil',
    away: 'Escocia',
    group: 'C',
    stadium: 'Miami Stadium',
  },
  {
    date: '2026-06-24T22:00:00Z',
    home: 'Marruecos',
    away: 'Haití',
    group: 'C',
    stadium: 'Atlanta Stadium',
  },
  {
    date: '2026-06-25T01:00:00Z',
    home: 'PLA_A',
    away: 'México',
    group: 'A',
    stadium: 'Estadio Ciudad de México',
  },
  {
    date: '2026-06-25T01:00:00Z',
    home: 'Sudáfrica',
    away: 'República de Corea',
    group: 'A',
    stadium: 'Estadio Monterrey',
  },

  // Jueves, 25 de junio 2026
  {
    date: '2026-06-25T20:00:00Z',
    home: 'Curazao',
    away: 'Costa del Marfil',
    group: 'E',
    stadium: 'Philadelphia Stadium',
  },
  {
    date: '2026-06-25T20:00:00Z',
    home: 'Ecuador',
    away: 'Alemania',
    group: 'E',
    stadium: 'New York New Jersey Stadium',
  },
  {
    date: '2026-06-25T23:00:00Z',
    home: 'Japón',
    away: 'PLA_D',
    group: 'F',
    stadium: 'Dallas Stadium',
  },
  {
    date: '2026-06-25T23:00:00Z',
    home: 'Túnez',
    away: 'Países Bajos',
    group: 'F',
    stadium: 'Kansas City Stadium',
  },
  {
    date: '2026-06-26T02:00:00Z',
    home: 'PLA_C',
    away: 'Estados Unidos',
    group: 'D',
    stadium: 'Los Angeles Stadium',
  },
  {
    date: '2026-06-26T02:00:00Z',
    home: 'Paraguay',
    away: 'Australia',
    group: 'D',
    stadium: 'San Francisco Bay Area Stadium',
  },

  // Viernes, 26 de junio 2026
  {
    date: '2026-06-26T19:00:00Z',
    home: 'Noruega',
    away: 'Francia',
    group: 'I',
    stadium: 'Boston Stadium',
  },
  {
    date: '2026-06-26T19:00:00Z',
    home: 'Senegal',
    away: 'PLA_E',
    group: 'I',
    stadium: 'Toronto Stadium',
  },
  {
    date: '2026-06-27T00:00:00Z',
    home: 'Cabo Verde',
    away: 'Arabia Saudí',
    group: 'H',
    stadium: 'Houston Stadium',
  },
  {
    date: '2026-06-27T00:00:00Z',
    home: 'Uruguay',
    away: 'España',
    group: 'H',
    stadium: 'Estadio Guadalajara',
  },
  {
    date: '2026-06-27T03:00:00Z',
    home: 'Egipto',
    away: 'Irán',
    group: 'G',
    stadium: 'Seattle Stadium',
  },
  {
    date: '2026-06-27T03:00:00Z',
    home: 'Nueva Zelanda',
    away: 'Bélgica',
    group: 'G',
    stadium: 'BC Place Vancouver',
  },

  // Sábado, 27 de junio 2026
  {
    date: '2026-06-27T21:00:00Z',
    home: 'Panamá',
    away: 'Inglaterra',
    group: 'L',
    stadium: 'New York New Jersey Stadium',
  },
  {
    date: '2026-06-27T21:00:00Z',
    home: 'Croacia',
    away: 'Ghana',
    group: 'L',
    stadium: 'Philadelphia Stadium',
  },
  {
    date: '2026-06-27T23:30:00Z',
    home: 'Colombia',
    away: 'Portugal',
    group: 'K',
    stadium: 'Miami Stadium',
  },
  {
    date: '2026-06-27T23:30:00Z',
    home: 'PLA_F',
    away: 'Uzbekistán',
    group: 'K',
    stadium: 'Atlanta Stadium',
  },
  {
    date: '2026-06-28T02:00:00Z',
    home: 'Argelia',
    away: 'Austria',
    group: 'J',
    stadium: 'Kansas City Stadium',
  },
  {
    date: '2026-06-28T02:00:00Z',
    home: 'Jordania',
    away: 'Argentina',
    group: 'J',
    stadium: 'Dallas Stadium',
  },
];

async function seed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    const matchRepository = AppDataSource.getRepository(Match);

    // Check if matches already exist
    const count = await matchRepository.count();
    if (count > 0) {
      console.log(
        `⚠️  Matches already exist in database (${count}). Skipping seeding to preserve data.`,
      );
      await AppDataSource.destroy();
      process.exit(0);
    }

    console.log('🌍 Iniciando carga del Mundial 2026 con DATOS REALES...');

    // Limpiar partidos existentes (Comentado por seguridad)
    // console.log('🗑️  Limpiando partidos anteriores...');
    // await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');

    console.log(
      `📝 Insertando ${REAL_MATCHES.length} partidos de fase de grupos...\n`,
    );

    let insertedCount = 0;
    let errorCount = 0;

    for (const matchData of REAL_MATCHES) {
      try {
        const match = matchRepository.create({
          homeTeam: matchData.home === 'TBD' ? 'TBD' : matchData.home,
          awayTeam: matchData.away === 'TBD' ? 'TBD' : matchData.away,
          homeFlag: getFlag(matchData.home),
          awayFlag: getFlag(matchData.away),
          homeTeamPlaceholder: matchData.home === 'TBD' ? 'Playoff' : null,
          awayTeamPlaceholder: matchData.away === 'TBD' ? 'Playoff' : null,
          date: new Date(matchData.date),
          group: matchData.group,
          phase: 'GROUP',
          stadium: matchData.stadium,
          homeScore: null,
          awayScore: null,
          status: 'PENDING',
          isManuallyLocked: false,
        });

        await matchRepository.save(match);
        insertedCount++;

        console.log(
          `✅ [${insertedCount}/${REAL_MATCHES.length}] ${matchData.home} vs ${matchData.away} - Grupo ${matchData.group}`,
        );
      } catch (error) {
        errorCount++;
        console.error(
          `❌ Error insertando: ${matchData.home} vs ${matchData.away}`,
          error,
        );
      }
    }

    console.log('\n✅ Fase de Grupos completada.\n');
    console.log('🌍 Generando Fase Final (Knockout Shells)...');

    // LÓGICA DE FASE FINAL (Copiada de MatchesService para asegurar consistencia)
    // 1. ROUND_32 mapping
    const r32Mapping = [
      { h: '1A', a: '3RD-1' },
      { h: '1B', a: '3RD-2' },
      { h: '1C', a: '3RD-3' },
      { h: '1D', a: '3RD-4' },
      { h: '1E', a: '3RD-5' },
      { h: '1F', a: '3RD-6' },
      { h: '1G', a: '3RD-7' },
      { h: '1H', a: '3RD-8' },
      { h: '1I', a: '2A' },
      { h: '1J', a: '2B' },
      { h: '1K', a: '2C' },
      { h: '1L', a: '2D' },
      { h: '2E', a: '2F' },
      { h: '2G', a: '2H' },
      { h: '2I', a: '2J' },
      { h: '2K', a: '2L' },
    ];

    // Fechas Estimadas R32 (Junio 28 - Julio 3)
    const r32Date = new Date('2026-06-28T16:00:00Z');

    for (let i = 0; i < 16; i++) {
      const m = matchRepository.create({
        phase: 'ROUND_32',
        bracketId: i + 1,
        status: 'PENDING',
        homeTeam: '',
        awayTeam: '',
        homeFlag: '',
        awayFlag: '',
        homeScore: null,
        awayScore: null,
        homeTeamPlaceholder: r32Mapping[i].h,
        awayTeamPlaceholder: r32Mapping[i].a,
        date: new Date(r32Date),
        isManuallyLocked: false,
      });
      await matchRepository.save(m);
      // Incrementar medio día aprox para distribuir fechas
      if (i % 3 === 0) r32Date.setDate(r32Date.getDate() + 1);
    }
    console.log('✅ Round of 32 shells creados (16 partidos)');

    // 2. ROUND_16 (8 partidos)
    const r16Date = new Date('2026-07-04T16:00:00Z');
    for (let i = 1; i <= 8; i++) {
      const m = matchRepository.create({
        phase: 'ROUND_16',
        bracketId: i,
        status: 'PENDING',
        homeTeam: '',
        awayTeam: '',
        homeTeamPlaceholder: `W32-${i * 2 - 1}`,
        awayTeamPlaceholder: `W32-${i * 2}`,
        date: new Date(r16Date),
        isManuallyLocked: false,
      });
      await matchRepository.save(m);
      if (i % 2 === 0) r16Date.setDate(r16Date.getDate() + 1);
    }
    console.log('✅ Round of 16 shells creados (8 partidos)');

    // 3. QUARTER (4 partidos)
    const qfDate = new Date('2026-07-09T16:00:00Z');
    for (let i = 1; i <= 4; i++) {
      const m = matchRepository.create({
        phase: 'QUARTER',
        bracketId: i,
        status: 'PENDING',
        homeTeam: '',
        awayTeam: '',
        homeTeamPlaceholder: `W16-${i * 2 - 1}`,
        awayTeamPlaceholder: `W16-${i * 2}`,
        date: new Date(qfDate),
        isManuallyLocked: false,
      });
      await matchRepository.save(m);
      if (i % 2 === 0) qfDate.setDate(qfDate.getDate() + 1);
    }
    console.log('✅ Quarter Finals shells creados (4 partidos)');

    // 4. SEMI (2 partidos)
    const semiDate = new Date('2026-07-14T20:00:00Z');
    for (let i = 1; i <= 2; i++) {
      const m = matchRepository.create({
        phase: 'SEMI',
        bracketId: i,
        status: 'PENDING',
        homeTeam: '',
        awayTeam: '',
        homeTeamPlaceholder: `WQ-${i * 2 - 1}`,
        awayTeamPlaceholder: `WQ-${i * 2}`,
        date: new Date(semiDate),
        isManuallyLocked: false,
      });
      await matchRepository.save(m);
      semiDate.setDate(semiDate.getDate() + 1);
    }
    console.log('✅ Semi Finals shells creados (2 partidos)');

    // 5. 3RD PLACE & FINAL
    const thirdPlace = matchRepository.create({
      phase: '3RD_PLACE',
      bracketId: 1,
      status: 'PENDING',
      homeTeam: '',
      awayTeam: '',
      homeTeamPlaceholder: 'L-Semi-1',
      awayTeamPlaceholder: 'L-Semi-2',
      date: new Date('2026-07-18T20:00:00Z'),
      isManuallyLocked: false,
    });
    await matchRepository.save(thirdPlace);

    const finalMatch = matchRepository.create({
      phase: 'FINAL',
      bracketId: 1,
      status: 'PENDING',
      homeTeam: '',
      awayTeam: '',
      homeTeamPlaceholder: 'W-Semi-1',
      awayTeamPlaceholder: 'W-Semi-2',
      date: new Date('2026-07-19T20:00:00Z'),
      isManuallyLocked: false,
    });
    await matchRepository.save(finalMatch);
    console.log('✅ Final & 3rd Place shells creados');

    console.log('\n' + '='.repeat(60));
    console.log(`✅ Partidos Grupos: ${insertedCount}`);
    console.log(`✅ Fase Final: 32 Shells generados`);
    console.log(`❌ Errores: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    console.log('🎉 ¡Carga COMPLETADA (Grupos + Llaves)!');
    console.log('📊 Total: 104 partidos configurados.\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en el seed:', error);
    process.exit(1);
  }
}

seed();
