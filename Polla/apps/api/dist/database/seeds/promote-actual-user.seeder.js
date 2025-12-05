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
const access_code_entity_1 = require("../entities/access-code.entity");
const league_participant_entity_1 = require("../entities/league-participant.entity");
const league_entity_1 = require("../entities/league.entity");
const organization_entity_1 = require("../entities/organization.entity");
const user_role_enum_1 = require("../enums/user-role.enum");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [user_entity_1.User, match_entity_1.Match, prediction_entity_1.Prediction, access_code_entity_1.AccessCode, league_participant_entity_1.LeagueParticipant, league_entity_1.League, organization_entity_1.Organization],
    synchronize: false,
});
async function promoteUserByActualId() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');
        const userRepository = AppDataSource.getRepository(user_entity_1.User);
        const actualUserId = '06204570-7414-4422-a818-a8b06418c284';
        const user = await userRepository.findOne({ where: { id: actualUserId } });
        if (!user) {
            console.error(`❌ Usuario con ID ${actualUserId} no encontrado`);
            await AppDataSource.destroy();
            process.exit(1);
        }
        console.log('📋 Usuario encontrado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.fullName}`);
        console.log(`   Rol actual: ${user.role}\n`);
        if (user.role === user_role_enum_1.UserRole.SUPER_ADMIN) {
            console.log('✅ El usuario ya es SUPER_ADMIN');
        }
        else {
            const oldRole = user.role;
            user.role = user_role_enum_1.UserRole.SUPER_ADMIN;
            await userRepository.save(user);
            console.log('\n' + '🎉'.repeat(40));
            console.log('✅ ROL ACTUALIZADO EXITOSAMENTE');
            console.log('═'.repeat(80));
            console.log(`   Rol anterior: ${oldRole}`);
            console.log(`   Rol nuevo: SUPER_ADMIN`);
            console.log('═'.repeat(80));
            console.log('🎉'.repeat(40) + '\n');
            console.log('🔄 Ahora recarga la página del navegador (F5)');
            console.log('📍 Ve a http://localhost:3001/admin');
            console.log('✅ Deberías poder acceder sin problemas\n');
        }
        await AppDataSource.destroy();
        console.log('✅ Script completado exitosamente\n');
    }
    catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}
promoteUserByActualId();
//# sourceMappingURL=promote-actual-user.seeder.js.map