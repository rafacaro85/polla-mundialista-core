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
exports.seedKnockoutStage = seedKnockoutStage;
const typeorm_1 = require("typeorm");
const match_entity_1 = require("../entities/match.entity");
const prediction_entity_1 = require("../entities/prediction.entity");
const user_entity_1 = require("../entities/user.entity");
const user_bracket_entity_1 = require("../entities/user-bracket.entity");
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
async function seedKnockoutStage(dataSource) {
    const matchRepository = dataSource.getRepository(match_entity_1.Match);
    console.log('🌱 Seeding knockout stage matches...');
    const baseDate = new Date('2026-07-01T16:00:00Z');
    const knockoutMatches = [
        {
            homeTeamPlaceholder: '1A',
            awayTeamPlaceholder: '2B',
            phase: 'ROUND_16',
            bracketId: 1,
            date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1C',
            awayTeamPlaceholder: '2D',
            phase: 'ROUND_16',
            bracketId: 2,
            date: new Date(baseDate.getTime() + 0 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1E',
            awayTeamPlaceholder: '2F',
            phase: 'ROUND_16',
            bracketId: 3,
            date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1G',
            awayTeamPlaceholder: '2H',
            phase: 'ROUND_16',
            bracketId: 4,
            date: new Date(baseDate.getTime() + 1 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1B',
            awayTeamPlaceholder: '2A',
            phase: 'ROUND_16',
            bracketId: 5,
            date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1D',
            awayTeamPlaceholder: '2C',
            phase: 'ROUND_16',
            bracketId: 6,
            date: new Date(baseDate.getTime() + 2 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1F',
            awayTeamPlaceholder: '2E',
            phase: 'ROUND_16',
            bracketId: 7,
            date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
        {
            homeTeamPlaceholder: '1H',
            awayTeamPlaceholder: '2G',
            phase: 'ROUND_16',
            bracketId: 8,
            date: new Date(baseDate.getTime() + 3 * 24 * 60 * 60 * 1000),
            status: 'PENDING',
        },
    ];
    const existingKnockout = await matchRepository.count({
        where: { phase: 'ROUND_16' },
    });
    if (existingKnockout > 0) {
        console.log(`⚠️  Found ${existingKnockout} existing ROUND_16 matches. Skipping seeding.`);
        return;
    }
    for (const matchData of knockoutMatches) {
        const match = matchRepository.create({
            ...matchData,
            homeTeam: '',
            awayTeam: '',
            homeScore: null,
            awayScore: null,
        });
        await matchRepository.save(match);
    }
    console.log(`✅ Successfully seeded ${knockoutMatches.length} knockout stage matches!`);
}
async function run() {
    console.log('🔌 Connecting to database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log(`Port: ${process.env.DB_PORT}`);
    console.log(`Database: ${process.env.DB_DATABASE}`);
    console.log(`Username: ${process.env.DB_USERNAME}`);
    const dataSource = new typeorm_1.DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_DATABASE || 'polla_db',
        entities: [match_entity_1.Match, prediction_entity_1.Prediction, user_entity_1.User, user_bracket_entity_1.UserBracket],
        synchronize: false,
    });
    try {
        await dataSource.initialize();
        console.log('✅ Database connected!');
        await seedKnockoutStage(dataSource);
        await dataSource.destroy();
        console.log('🎉 Seeding complete!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
if (require.main === module) {
    run();
}
//# sourceMappingURL=create-knockout-matches.seeder.js.map