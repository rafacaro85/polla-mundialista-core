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
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'polla_db',
    entities: ['src/**/*.entity.ts'],
    synchronize: false,
});
async function verifyUser() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conectado a la base de datos');
        const email = process.argv[2];
        if (!email) {
            console.error('❌ Por favor proporciona un email: npm run verify:user -- email@example.com');
            process.exit(1);
        }
        const userRepository = AppDataSource.getRepository('users');
        const user = await userRepository.findOne({ where: { email } });
        if (!user) {
            console.error(`❌ Usuario con email ${email} no encontrado`);
            process.exit(1);
        }
        console.log('\n📋 Estado actual del usuario:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.fullName || user.nickname}`);
        console.log(`   Verificado: ${user.isVerified ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Tiene contraseña: ${user.password ? 'SÍ' : 'NO (Google)'}`);
        if (!user.isVerified) {
            console.log('\n🔧 Verificando usuario...');
            await userRepository.update(user.id, {
                isVerified: true,
                verificationCode: null
            });
            console.log('✅ Usuario verificado exitosamente');
        }
        else {
            console.log('\n✅ El usuario ya está verificado');
        }
        await AppDataSource.destroy();
    }
    catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}
verifyUser();
//# sourceMappingURL=verify-user.seeder.js.map