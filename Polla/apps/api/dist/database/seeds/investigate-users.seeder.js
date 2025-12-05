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
async function investigateUsers() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');
        const userRepository = AppDataSource.getRepository(user_entity_1.User);
        const allUsers = await userRepository.find({
            order: { createdAt: 'DESC' }
        });
        console.log('═'.repeat(80));
        console.log(`📊 TOTAL DE USUARIOS EN LA BASE DE DATOS: ${allUsers.length}`);
        console.log('═'.repeat(80));
        if (allUsers.length === 0) {
            console.log('\n❌ No hay usuarios en la base de datos\n');
            await AppDataSource.destroy();
            return;
        }
        const usersByEmail = new Map();
        allUsers.forEach(user => {
            const existing = usersByEmail.get(user.email) || [];
            existing.push(user);
            usersByEmail.set(user.email, existing);
        });
        console.log('\n📋 LISTADO COMPLETO DE USUARIOS:\n');
        allUsers.forEach((user, index) => {
            console.log(`${index + 1}. Usuario:`);
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Nombre: ${user.fullName || 'N/A'}`);
            console.log(`   Nickname: ${user.nickname || 'N/A'}`);
            console.log(`   Google ID: ${user.googleId || 'N/A'}`);
            console.log(`   Rol: ${user.role}`);
            console.log(`   Creado: ${user.createdAt.toISOString()}`);
            console.log('');
        });
        console.log('═'.repeat(80));
        console.log('🔍 ANÁLISIS DE DUPLICADOS:');
        console.log('═'.repeat(80));
        let hasDuplicates = false;
        usersByEmail.forEach((users, email) => {
            if (users.length > 1) {
                hasDuplicates = true;
                console.log(`\n⚠️  DUPLICADO DETECTADO: ${email}`);
                console.log(`   Cantidad de usuarios: ${users.length}`);
                users.forEach((user, idx) => {
                    console.log(`   ${idx + 1}. ID: ${user.id} | Rol: ${user.role} | Creado: ${user.createdAt.toISOString()}`);
                });
            }
        });
        if (!hasDuplicates) {
            console.log('\n✅ No se detectaron duplicados\n');
        }
        console.log('\n' + '═'.repeat(80));
        console.log('🎯 USUARIOS CON EMAIL racv85@gmail.com:');
        console.log('═'.repeat(80));
        const racvUsers = allUsers.filter(u => u.email === 'racv85@gmail.com');
        if (racvUsers.length === 0) {
            console.log('\n❌ No se encontró ningún usuario con ese email\n');
        }
        else {
            console.log(`\n✅ Encontrados ${racvUsers.length} usuario(s):\n`);
            racvUsers.forEach((user, idx) => {
                console.log(`${idx + 1}. ID: ${user.id}`);
                console.log(`   Rol: ${user.role}`);
                console.log(`   Nombre: ${user.fullName}`);
                console.log(`   Nickname: ${user.nickname}`);
                console.log(`   Creado: ${user.createdAt.toISOString()}`);
                console.log('');
            });
            if (racvUsers.length > 1) {
                console.log('⚠️  ACCIÓN RECOMENDADA:');
                console.log('   1. Eliminar usuarios duplicados');
                console.log('   2. Mantener solo el usuario con rol SUPER_ADMIN');
                console.log('   3. O mantener el más reciente y actualizar su rol\n');
            }
        }
        await AppDataSource.destroy();
        console.log('✅ Investigación completada\n');
    }
    catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}
investigateUsers();
//# sourceMappingURL=investigate-users.seeder.js.map