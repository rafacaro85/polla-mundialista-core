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
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [match_entity_1.Match, prediction_entity_1.Prediction, user_entity_1.User, access_code_entity_1.AccessCode, league_participant_entity_1.LeagueParticipant, league_entity_1.League, organization_entity_1.Organization],
    synchronize: false,
});
async function resetMatches() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida');
        const matchRepository = AppDataSource.getRepository(match_entity_1.Match);
        const matches = await matchRepository.find();
        console.log(`📊 Encontrados ${matches.length} partidos`);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(20, 0, 0, 0);
        for (const match of matches) {
            match.status = 'SCHEDULED';
            match.homeScore = null;
            match.awayScore = null;
            match.date = tomorrow;
            await matchRepository.save(match);
        }
        console.log('✅ Todos los partidos han sido reiniciados');
        console.log('   - Status: SCHEDULED');
        console.log('   - Scores: null');
        console.log('   - Fecha: Mañana 8 PM');
        const predictionRepository = AppDataSource.getRepository(prediction_entity_1.Prediction);
        const deleteResult = await predictionRepository
            .createQueryBuilder()
            .delete()
            .execute();
        console.log(`🗑️  Eliminadas ${deleteResult.affected || 0} predicciones`);
        await AppDataSource.destroy();
        console.log('✅ Script completado exitosamente');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
resetMatches();
//# sourceMappingURL=reset-matches.seeder.js.map