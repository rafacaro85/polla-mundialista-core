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

async function findAllRacvUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    const userRepository = AppDataSource.getRepository(User);

    // Buscar TODOS los usuarios con este email
    const users = await userRepository.find({
      where: { email: 'racv85@gmail.com' },
    });

    console.log(
      `📋 Usuarios encontrados con email racv85@gmail.com: ${users.length}\n`,
    );
    console.log('═'.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Usuario:`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nombre: ${user.fullName}`);
      console.log(`   Nickname: ${user.nickname}`);
      console.log(`   Google ID: ${user.googleId || 'N/A'}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Creado: ${user.createdAt}`);
    });

    console.log('\n' + '═'.repeat(80));

    // Ahora actualizar TODOS a SUPER_ADMIN
    console.log('\n🔧 Actualizando todos los usuarios a SUPER_ADMIN...\n');

    for (const user of users) {
      if (user.role !== 'SUPER_ADMIN') {
        user.role = 'SUPER_ADMIN' as any;
        await userRepository.save(user);
        console.log(`✅ Usuario ${user.id} actualizado a SUPER_ADMIN`);
      } else {
        console.log(`ℹ️  Usuario ${user.id} ya es SUPER_ADMIN`);
      }
    }

    console.log('\n🎉 Todos los usuarios actualizados\n');

    await AppDataSource.destroy();
    console.log('✅ Script completado exitosamente\n');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

findAllRacvUsers();
