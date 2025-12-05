"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const match_entity_1 = require("../entities/match.entity");
const prediction_entity_1 = require("../entities/prediction.entity");
const user_entity_1 = require("../entities/user.entity");
const access_code_entity_1 = require("../entities/access-code.entity");
const league_participant_entity_1 = require("../entities/league-participant.entity");
const league_entity_1 = require("../entities/league.entity");
const organization_entity_1 = require("../entities/organization.entity");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'polla_mundialista',
    entities: [match_entity_1.Match, prediction_entity_1.Prediction, user_entity_1.User, access_code_entity_1.AccessCode, league_participant_entity_1.LeagueParticipant, league_entity_1.League, organization_entity_1.Organization],
    synchronize: false,
});
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
const FLAG_CODES = {
    'Qatar': 'qa', 'Ecuador': 'ec', 'Senegal': 'sn', 'Netherlands': 'nl',
    'England': 'gb-eng', 'Iran': 'ir', 'USA': 'us', 'Wales': 'gb-wls',
    'Argentina': 'ar', 'Saudi Arabia': 'sa', 'Mexico': 'mx', 'Poland': 'pl',
    'France': 'fr', 'Australia': 'au', 'Denmark': 'dk', 'Tunisia': 'tn',
    'Spain': 'es', 'Costa Rica': 'cr', 'Germany': 'de', 'Japan': 'jp',
    'Belgium': 'be', 'Canada': 'ca', 'Morocco': 'ma', 'Croatia': 'hr',
    'Brazil': 'br', 'Serbia': 'rs', 'Switzerland': 'ch', 'Cameroon': 'cm',
    'Portugal': 'pt', 'Ghana': 'gh', 'Uruguay': 'uy', 'South Korea': 'kr',
};
function getFlag(team) {
    const code = FLAG_CODES[team];
    return code ? `https://flagcdn.com/w40/${code}.png` : '';
}
function generateGroupMatches(group, teams, startDate) {
    const matches = [];
    const pairings = [
        [0, 1], [2, 3],
        [0, 2], [1, 3],
        [0, 3], [1, 2],
    ];
    pairings.forEach((pair, index) => {
        const matchDate = new Date(startDate);
        matchDate.setHours(matchDate.getHours() + (index * 4));
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
        const matchRepository = AppDataSource.getRepository(match_entity_1.Match);
        console.log('🏆 Iniciando seed COMPLETO (Grupos + Octavos)...');
        console.log('🗑️  Limpiando partidos anteriores...');
        await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');
        const allMatches = [];
        let bracketIdCounter = 1;
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
        console.log('🏆 Generando Octavos de Final (8 partidos)...');
        const round16Date = new Date(baseDate);
        round16Date.setDate(round16Date.getDate() + 10);
        round16Date.setHours(14, 0, 0, 0);
        ROUND_16_REAL.forEach((match, index) => {
            const matchDate = new Date(round16Date);
            matchDate.setHours(matchDate.getHours() + (index * 6));
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
    }
    catch (error) {
        console.error('❌ Error en el seed:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=complete-tournament.seeder.js.map