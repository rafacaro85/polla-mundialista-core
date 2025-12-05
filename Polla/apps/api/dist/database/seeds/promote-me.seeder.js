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
async function promoteMe() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');
        const userRepository = AppDataSource.getRepository(user_entity_1.User);
        let user = await userRepository.findOne({
            where: { nickname: 'Capitan Arcas' }
        });
        if (!user) {
            console.log('⚠️  Usuario "Capitan Arcas" no encontrado, buscando primer usuario...');
            const users = await userRepository.find({ take: 1 });
            if (users.length === 0) {
                console.error('❌ Error: No hay usuarios en la base de datos');
                await AppDataSource.destroy();
                process.exit(1);
            }
            user = users[0];
            console.log(`ℹ️  Usando usuario: ${user.fullName || user.email}\n`);
        }
        if (user.role === user_role_enum_1.UserRole.ADMIN || user.role === user_role_enum_1.UserRole.SUPER_ADMIN) {
            console.log(`✅ El usuario "${user.fullName || user.nickname}" ya es ${user.role}`);
            await AppDataSource.destroy();
            return;
        }
        const oldRole = user.role;
        user.role = user_role_enum_1.UserRole.SUPER_ADMIN;
        await userRepository.save(user);
        console.log('🎉 ¡Usuario promovido a SUPER_ADMIN exitosamente!');
        console.log('═'.repeat(60));
        console.log(`   👤 Nombre: ${user.fullName || 'N/A'}`);
        console.log(`   🏷️  Nickname: ${user.nickname || 'N/A'}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔄 Rol anterior: ${oldRole}`);
        console.log(`   ⭐ Rol actual: SUPER_ADMIN`);
        console.log('═'.repeat(60));
        await AppDataSource.destroy();
        console.log('\n✅ Script completado exitosamente');
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
promoteMe();
//# sourceMappingURL=promote-me.seeder.js.map