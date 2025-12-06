import * as dotenv from 'dotenv';

dotenv.config();

console.log('🔍 Verificando variables de entorno:\n');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ NO configurada');
console.log('DB_HOST:', process.env.DB_HOST || 'No configurada');
console.log('DB_PORT:', process.env.DB_PORT || 'No configurada');
console.log('\n');

if (process.env.DATABASE_URL) {
    // Ocultar password por seguridad
    const url = process.env.DATABASE_URL;
    const masked = url.replace(/:[^:@]+@/, ':****@');
    console.log('DATABASE_URL (masked):', masked);
} else {
    console.log('⚠️  DATABASE_URL no está configurada');
    console.log('El seeder usará las variables individuales (DB_HOST, DB_PORT, etc.)');
}
