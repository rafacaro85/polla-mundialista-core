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
const user_entity_1 = require("../entities/user.entity");
const match_entity_1 = require("../entities/match.entity");
const prediction_entity_1 = require("../entities/prediction.entity");
const bcrypt = __importStar(require("bcrypt"));
const dotenv_1 = require("dotenv");
const league_entity_1 = require("../entities/league.entity");
const league_participant_entity_1 = require("../entities/league-participant.entity");
const access_code_entity_1 = require("../entities/access-code.entity");
const organization_entity_1 = require("../entities/organization.entity");
const user_role_enum_1 = require("../enums/user-role.enum");
(0, dotenv_1.config)();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [user_entity_1.User, match_entity_1.Match, prediction_entity_1.Prediction, league_entity_1.League, league_participant_entity_1.LeagueParticipant, access_code_entity_1.AccessCode, organization_entity_1.Organization],
    synchronize: true,
});
const fakeNicknames = [
    'FIFA_Pro', 'BetKing', 'GolazoMaster', 'SoccerGuru', 'LaPulga_10',
    'CR7_Legend', 'NeymarJr_Fan', 'Mbappe_Speed', 'Haaland_Robot', 'Vini_Dance',
    'Modric_Magic', 'Kroos_Control', 'Bellingham_Hey', 'Pedri_Potter', 'Gavi_Fight',
    'Lewa_Goal', 'Kane_Hurricane', 'Salah_King', 'DeBruyne_Assist', 'Courtois_Wall'
];
async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('Data Source initialized');
        const userRepository = AppDataSource.getRepository(user_entity_1.User);
        const matchRepository = AppDataSource.getRepository(match_entity_1.Match);
        const predictionRepository = AppDataSource.getRepository(prediction_entity_1.Prediction);
        console.log('Creating fake users...');
        const password = await bcrypt.hash('password123', 10);
        const createdUsers = [];
        for (const nickname of fakeNicknames) {
            let user = await userRepository.findOne({ where: { email: `${nickname.toLowerCase()}@example.com` } });
            if (!user) {
                user = userRepository.create({
                    email: `${nickname.toLowerCase()}@example.com`,
                    password,
                    fullName: nickname.replace('_', ' '),
                    nickname: nickname,
                    avatarUrl: `https://i.pravatar.cc/150?u=${nickname}`,
                    role: user_role_enum_1.UserRole.PLAYER,
                });
                await userRepository.save(user);
            }
            createdUsers.push(user);
        }
        let match = await matchRepository.findOne({ where: { status: 'FINISHED' } });
        if (!match) {
            console.log('No finished match found. Creating one...');
            match = matchRepository.create({
                homeTeam: 'Leyendas A',
                homeFlag: 'https://flagcdn.com/h80/un.png',
                awayTeam: 'Leyendas B',
                awayFlag: 'https://flagcdn.com/h80/un.png',
                date: new Date(),
                status: 'FINISHED',
                homeScore: 3,
                awayScore: 2
            });
            await matchRepository.save(match);
        }
        else {
            console.log('Found existing finished match:', match.id);
        }
        console.log('Creating predictions with points...');
        const pointsOptions = [0, 3, 5, 10, 15];
        for (const user of createdUsers) {
            const points = pointsOptions[Math.floor(Math.random() * pointsOptions.length)];
            let prediction = await predictionRepository.findOne({ where: { user: { id: user.id }, match: { id: match.id } } });
            if (!prediction) {
                prediction = predictionRepository.create({
                    user,
                    match,
                    homeScore: 0,
                    awayScore: 0,
                    points: points
                });
            }
            else {
                prediction.points = points;
            }
            await predictionRepository.save(prediction);
        }
        console.log(`Ranking sembrado con ${createdUsers.length} usuarios y puntos variados.`);
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding ranking:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=ranking.seeder.js.map