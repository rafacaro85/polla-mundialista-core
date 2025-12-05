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
async function promoteRacv() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');
        const userRepository = AppDataSource.getRepository(user_entity_1.User);
        const targetEmail = 'racv85@gmail.com';
        const user = await userRepository.findOne({
            where: { email: targetEmail }
        });
        if (!user) {
            console.error('\n' + '🔴'.repeat(30));
            console.error('❌❌❌ ¡CORREO NO ENCONTRADO! ❌❌❌');
            console.error(`❌ El usuario con email "${targetEmail}" NO EXISTE en la base de datos`);
            console.error('❌ Debes iniciar sesión primero con Google usando ese correo');
            console.error('🔴'.repeat(30) + '\n');
            await AppDataSource.destroy();
            process.exit(1);
        }
        if (user.role === user_role_enum_1.UserRole.SUPER_ADMIN) {
            console.log('\n' + '👑'.repeat(30));
            console.log(`✅ ${targetEmail} YA ES EL DUEÑO DEL JUEGO`);
            console.log(`✅ Rol actual: ${user.role}`);
            console.log('👑'.repeat(30) + '\n');
            await AppDataSource.destroy();
            return;
        }
        const oldRole = user.role;
        user.role = user_role_enum_1.UserRole.SUPER_ADMIN;
        await userRepository.save(user);
        console.log('\n' + '🎉'.repeat(30));
        console.log('👑👑👑 ¡ASCENSO COMPLETADO! 👑👑👑');
        console.log('═'.repeat(60));
        console.log(`   👤 Usuario: ${user.fullName || user.nickname || 'N/A'}`);
        console.log(`   📧 Email: ${targetEmail}`);
        console.log(`   🔄 Rol anterior: ${oldRole}`);
        console.log(`   ⭐ Rol actual: SUPER_ADMIN`);
        console.log('═'.repeat(60));
        console.log('👑 ¡racv85@gmail.com ahora es el DUEÑO DEL JUEGO! 👑');
        console.log('🎉'.repeat(30) + '\n');
        await AppDataSource.destroy();
        console.log('✅ Script completado exitosamente\n');
    }
    catch (error) {
        console.error('\n❌ Error inesperado:', error);
        process.exit(1);
    }
}
promoteRacv();
//# sourceMappingURL=promote-racv.seeder.js.map