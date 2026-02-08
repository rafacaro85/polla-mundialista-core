import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
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
      console.error(
        '❌ Por favor proporciona un email: npm run verify:user -- email@example.com',
      );
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
        verificationCode: null,
      });
      console.log('✅ Usuario verificado exitosamente');
    } else {
      console.log('\n✅ El usuario ya está verificado');
    }

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyUser();
