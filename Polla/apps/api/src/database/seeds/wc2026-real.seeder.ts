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

const AppDataSource = process.env.DATABASE_URL
    ? new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization],
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
        entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization],
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

// Códigos ISO para banderas (flagcdn.com)
const FLAG_CODES: Record<string, string> = {
    'Qatar': 'qa', 'Ecuador': 'ec', 'Senegal': 'sn', 'Netherlands': 'nl',
    'England': 'gb-eng', 'Iran': 'ir', 'USA': 'us', 'Wales': 'gb-wls',
    'Argentina': 'ar', 'Saudi Arabia': 'sa', 'Mexico': 'mx', 'Poland': 'pl',
    'France': 'fr', 'Australia': 'au', 'Denmark': 'dk', 'Tunisia': 'tn',
    'Spain': 'es', 'Costa Rica': 'cr', 'Germany': 'de', 'Japan': 'jp',
    'Belgium': 'be', 'Canada': 'ca', 'Morocco': 'ma', 'Croatia': 'hr',
    'Brazil': 'br', 'Serbia': 'rs', 'Switzerland': 'ch', 'Cameroon': 'cm',
    'Portugal': 'pt', 'Ghana': 'gh', 'Uruguay': 'uy', 'South Korea': 'kr',
};

function getFlag(team: string): string {
    const code = FLAG_CODES[team];
    return code ? `https://flagcdn.com/w40/${code}.png` : '';
}

// Generar partidos de fase de grupos (todos contra todos)
function generateGroupMatches(group: string, teams: string[], startDate: Date): any[] {
    const matches: any[] = [];

    // Todos contra todos: 6 partidos por grupo
    const pairings = [
        [0, 1], [2, 3], // Jornada 1
        [0, 2], [1, 3], // Jornada 2
        [0, 3], [1, 2], // Jornada 3
    ];

    pairings.forEach((pair, index) => {
        const matchDate = new Date(startDate);
        matchDate.setHours(matchDate.getHours() + (index * 4)); // Espaciar partidos cada 4 horas

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

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida');

        const matchRepository = AppDataSource.getRepository(Match);

        console.log('🌍 Iniciando seed del Mundial 2026 (DATOS DE PRUEBA)...');

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
        baseDate.setDate(baseDate.getDate() + 1); // Empezar mañana
        baseDate.setHours(12, 0, 0, 0); // Mediodía

        Object.entries(GROUPS).forEach(([groupLetter, teams], groupIndex) => {
            const groupDate = new Date(baseDate);
            groupDate.setDate(groupDate.getDate() + groupIndex); // Un día por grupo

            const groupMatches = generateGroupMatches(groupLetter, teams, groupDate);
            allMatches.push(...groupMatches);

            console.log(`   ✓ Grupo ${groupLetter}: ${groupMatches.length} partidos`);
        });

        // ========================================
        // OCTAVOS DE FINAL (8 partidos)
        // ========================================
        console.log('🏆 Generando Octavos de Final (8 partidos)...');

        const round16Date = new Date(baseDate);
        round16Date.setDate(round16Date.getDate() + 10); // 10 días después

        const round16Matches = [
            { home: '1A', away: '2B' },
            { home: '1C', away: '2D' },
            { home: '1D', away: '2C' },
            { home: '1B', away: '2A' },
            { home: '1E', away: '2F' },
            { home: '1G', away: '2H' },
            { home: '1F', away: '2E' },
            { home: '1H', away: '2G' },
        ];

        round16Matches.forEach((match, index) => {
            const matchDate = new Date(round16Date);
            matchDate.setHours(matchDate.getHours() + (index * 6)); // Espaciar cada 6 horas

            allMatches.push({
                homeTeam: 'TBD',
                awayTeam: 'TBD',
                homeTeamPlaceholder: match.home,
                awayTeamPlaceholder: match.away,
                phase: 'ROUND_16',
                bracketId: bracketIdCounter++,
                status: 'PENDING',
                date: matchDate,
                homeScore: null,
                awayScore: null,
            });
        });

        // ========================================
        // CUARTOS DE FINAL (4 partidos)
        // ========================================
        console.log('🥇 Generando Cuartos de Final (4 partidos)...');

        const quarterDate = new Date(round16Date);
        quarterDate.setDate(quarterDate.getDate() + 3);

        const quarterMatches = [
            { home: 'Winner R16-1', away: 'Winner R16-2' },
            { home: 'Winner R16-3', away: 'Winner R16-4' },
            { home: 'Winner R16-5', away: 'Winner R16-6' },
            { home: 'Winner R16-7', away: 'Winner R16-8' },
        ];

        quarterMatches.forEach((match, index) => {
            const matchDate = new Date(quarterDate);
            matchDate.setHours(matchDate.getHours() + (index * 8));

            allMatches.push({
                homeTeam: 'TBD',
                awayTeam: 'TBD',
                homeTeamPlaceholder: match.home,
                awayTeamPlaceholder: match.away,
                phase: 'QUARTER',
                bracketId: bracketIdCounter++,
                status: 'PENDING',
                date: matchDate,
                homeScore: null,
                awayScore: null,
            });
        });

        // ========================================
        // SEMIFINALES (2 partidos)
        // ========================================
        console.log('🏅 Generando Semifinales (2 partidos)...');

        const semiDate = new Date(quarterDate);
        semiDate.setDate(semiDate.getDate() + 3);

        const semiMatches = [
            { home: 'Winner Q1', away: 'Winner Q2' },
            { home: 'Winner Q3', away: 'Winner Q4' },
        ];

        semiMatches.forEach((match, index) => {
            const matchDate = new Date(semiDate);
            matchDate.setHours(matchDate.getHours() + (index * 12));

            allMatches.push({
                homeTeam: 'TBD',
                awayTeam: 'TBD',
                homeTeamPlaceholder: match.home,
                awayTeamPlaceholder: match.away,
                phase: 'SEMI',
                bracketId: bracketIdCounter++,
                status: 'PENDING',
                date: matchDate,
                homeScore: null,
                awayScore: null,
            });
        });

        // ========================================
        // TERCER LUGAR (1 partido)
        // ========================================
        console.log('🥉 Generando Tercer Lugar (1 partido)...');

        const thirdPlaceDate = new Date(semiDate);
        thirdPlaceDate.setDate(thirdPlaceDate.getDate() + 2);

        allMatches.push({
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            homeTeamPlaceholder: 'Loser S1',
            awayTeamPlaceholder: 'Loser S2',
            phase: '3RD_PLACE',
            bracketId: bracketIdCounter++,
            status: 'PENDING',
            date: thirdPlaceDate,
            homeScore: null,
            awayScore: null,
        });

        // ========================================
        // FINAL (1 partido)
        // ========================================
        console.log('🏆 Generando FINAL (1 partido)...');

        const finalDate = new Date(thirdPlaceDate);
        finalDate.setDate(finalDate.getDate() + 1);

        allMatches.push({
            homeTeam: 'TBD',
            awayTeam: 'TBD',
            homeTeamPlaceholder: 'Winner S1',
            awayTeamPlaceholder: 'Winner S2',
            phase: 'FINAL',
            bracketId: bracketIdCounter++,
            status: 'PENDING',
            date: finalDate,
            homeScore: null,
            awayScore: null,
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
        console.log('   - Octavos: 8 partidos');
        console.log('   - Cuartos: 4 partidos');
        console.log('   - Semifinales: 2 partidos');
        console.log('   - Tercer Lugar: 1 partido');
        console.log('   - FINAL: 1 partido');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error en el seed:', error);
        process.exit(1);
    }
}

seed();
