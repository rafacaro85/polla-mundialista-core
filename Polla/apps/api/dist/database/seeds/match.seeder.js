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
const matchesData = [
    {
        homeTeam: 'Colombia',
        homeFlag: 'https://flagcdn.com/h80/co.png',
        awayTeam: 'Argentina',
        awayFlag: 'https://flagcdn.com/h80/ar.png',
        date: new Date(),
        status: 'SCHEDULED',
    },
    {
        homeTeam: 'Brasil',
        homeFlag: 'https://flagcdn.com/h80/br.png',
        awayTeam: 'Francia',
        awayFlag: 'https://flagcdn.com/h80/fr.png',
        date: new Date(),
        status: 'SCHEDULED',
    },
    {
        homeTeam: 'España',
        homeFlag: 'https://flagcdn.com/h80/es.png',
        awayTeam: 'Alemania',
        awayFlag: 'https://flagcdn.com/h80/de.png',
        date: new Date(Date.now() + 86400000),
        status: 'SCHEDULED',
    },
    {
        homeTeam: 'USA',
        homeFlag: 'https://flagcdn.com/h80/us.png',
        awayTeam: 'México',
        awayFlag: 'https://flagcdn.com/h80/mx.png',
        date: new Date(Date.now() + 86400000),
        status: 'SCHEDULED',
    },
    {
        homeTeam: 'Inglaterra',
        homeFlag: 'https://flagcdn.com/h80/gb-eng.png',
        awayTeam: 'Italia',
        awayFlag: 'https://flagcdn.com/h80/it.png',
        date: new Date(Date.now() + 172800000),
        status: 'SCHEDULED',
    },
    {
        homeTeam: 'Portugal',
        homeFlag: 'https://flagcdn.com/h80/pt.png',
        awayTeam: 'Uruguay',
        awayFlag: 'https://flagcdn.com/h80/uy.png',
        date: new Date(Date.now() + 172800000),
        status: 'SCHEDULED',
    },
];
async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Data Source has been initialized!');
        const matchRepository = AppDataSource.getRepository(match_entity_1.Match);
        console.log('Cleaning existing matches...');
        await AppDataSource.query('TRUNCATE TABLE "matches" CASCADE');
        console.log('Inserting new matches...');
        for (const matchData of matchesData) {
            const match = matchRepository.create(matchData);
            await matchRepository.save(match);
            console.log(`Created match: ${match.homeTeam} vs ${match.awayTeam}`);
        }
        console.log('Seeding completed successfully.');
        process.exit(0);
    }
    catch (err) {
        console.error('Error during seeding:', err);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=match.seeder.js.map