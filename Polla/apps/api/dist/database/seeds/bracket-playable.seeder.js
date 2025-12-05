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
const FLAG_CODES = {
    'Netherlands': 'nl', 'USA': 'us', 'Argentina': 'ar', 'Australia': 'au',
    'France': 'fr', 'Poland': 'pl', 'England': 'gb-eng', 'Senegal': 'sn',
    'Japan': 'jp', 'Croatia': 'hr', 'Brazil': 'br', 'South Korea': 'kr',
    'Morocco': 'ma', 'Spain': 'es', 'Portugal': 'pt', 'Switzerland': 'ch',
};
function getFlag(team) {
    const code = FLAG_CODES[team];
    return code ? `https://flagcdn.com/w40/${code}.png` : '';
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
        console.log('🏆 Iniciando seed de Octavos de Final con equipos REALES...');
        console.log('🗑️  Limpiando partidos anteriores...');
        await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');
        const allMatches = [];
        let bracketIdCounter = 1;
        console.log('⚽ Generando Octavos de Final (8 partidos)...');
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + 1);
        baseDate.setHours(14, 0, 0, 0);
        ROUND_16_REAL.forEach((match, index) => {
            const matchDate = new Date(baseDate);
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
        console.log('   - Octavos de Final: 8 partidos con equipos reales');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error en el seed:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=bracket-playable.seeder.js.map