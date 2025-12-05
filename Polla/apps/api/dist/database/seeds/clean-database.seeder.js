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
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [],
    synchronize: false,
});
async function cleanDatabase() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');
        console.log('🗑️  Eliminando predicciones...');
        await AppDataSource.query('DELETE FROM predictions');
        console.log('✅ Predicciones eliminadas');
        console.log('🗑️  Eliminando participantes de ligas...');
        await AppDataSource.query('DELETE FROM league_participants');
        console.log('✅ Participantes eliminados');
        console.log('🗑️  Eliminando ligas...');
        await AppDataSource.query('DELETE FROM leagues');
        console.log('✅ Ligas eliminadas');
        console.log('🗑️  Eliminando códigos de acceso...');
        await AppDataSource.query('DELETE FROM access_codes');
        console.log('✅ Códigos eliminados');
        console.log('🗑️  Eliminando usuarios...');
        await AppDataSource.query('DELETE FROM users');
        console.log('✅ Usuarios eliminados');
        const result = await AppDataSource.query('SELECT COUNT(*) as count FROM users');
        const count = parseInt(result[0].count);
        console.log('\n' + '═'.repeat(60));
        console.log(`📊 Usuarios restantes: ${count}`);
        console.log('═'.repeat(60));
        if (count === 0) {
            console.log('\n🎉 ¡Base de datos limpiada exitosamente!');
            console.log('✅ Puedes continuar con el siguiente paso\n');
        }
        else {
            console.log('\n⚠️  Advertencia: Aún quedan usuarios en la base de datos');
        }
        await AppDataSource.destroy();
    }
    catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}
cleanDatabase();
//# sourceMappingURL=clean-database.seeder.js.map