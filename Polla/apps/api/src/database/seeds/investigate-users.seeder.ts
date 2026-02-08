import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    User,
    Match,
    Prediction,
    AccessCode,
    LeagueParticipant,
    League,
    Organization,
  ],
  synchronize: false,
});

async function investigateUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    const userRepository = AppDataSource.getRepository(User);

    // Buscar TODOS los usuarios
    const allUsers = await userRepository.find({
      order: { createdAt: 'DESC' },
    });

    console.log('═'.repeat(80));
    console.log(`📊 TOTAL DE USUARIOS EN LA BASE DE DATOS: ${allUsers.length}`);
    console.log('═'.repeat(80));

    if (allUsers.length === 0) {
      console.log('\n❌ No hay usuarios en la base de datos\n');
      await AppDataSource.destroy();
      return;
    }

    // Agrupar por email
    const usersByEmail = new Map<string, User[]>();
    allUsers.forEach((user) => {
      const existing = usersByEmail.get(user.email) || [];
      existing.push(user);
      usersByEmail.set(user.email, existing);
    });

    // Mostrar todos los usuarios
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

    // Detectar duplicados
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
          console.log(
            `   ${idx + 1}. ID: ${user.id} | Rol: ${user.role} | Creado: ${user.createdAt.toISOString()}`,
          );
        });
      }
    });

    if (!hasDuplicates) {
      console.log('\n✅ No se detectaron duplicados\n');
    }

    // Buscar específicamente racv85@gmail.com
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 USUARIOS CON EMAIL racv85@gmail.com:');
    console.log('═'.repeat(80));

    const racvUsers = allUsers.filter((u) => u.email === 'racv85@gmail.com');

    if (racvUsers.length === 0) {
      console.log('\n❌ No se encontró ningún usuario con ese email\n');
    } else {
      console.log(`\n✅ Encontrados ${racvUsers.length} usuario(s):\n`);
      racvUsers.forEach((user, idx) => {
        console.log(`${idx + 1}. ID: ${user.id}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Nombre: ${user.fullName}`);
        console.log(`   Nickname: ${user.nickname}`);
        console.log(`   Creado: ${user.createdAt.toISOString()}`);
        console.log('');
      });

      // Recomendar acción
      if (racvUsers.length > 1) {
        console.log('⚠️  ACCIÓN RECOMENDADA:');
        console.log('   1. Eliminar usuarios duplicados');
        console.log('   2. Mantener solo el usuario con rol SUPER_ADMIN');
        console.log('   3. O mantener el más reciente y actualizar su rol\n');
      }
    }

    await AppDataSource.destroy();
    console.log('✅ Investigación completada\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

investigateUsers();
