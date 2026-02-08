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

async function listUsers() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    const userRepository = AppDataSource.getRepository(User);

    // Obtener todos los usuarios
    const users = await userRepository.find();

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      await AppDataSource.destroy();
      return;
    }

    console.log(`📋 Usuarios encontrados: ${users.length}\n`);
    console.log('═'.repeat(80));

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.fullName || 'Sin nombre'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Nickname: ${user.nickname || 'N/A'}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Google ID: ${user.googleId ? 'Sí' : 'No'}`);
      console.log(`   Creado: ${user.createdAt.toLocaleDateString('es-ES')}`);
    });

    console.log('\n' + '═'.repeat(80));
    console.log('\n💡 Para promover un usuario a ADMIN, ejecuta:');
    console.log('   npm run seed:promote-admin -- EMAIL_DEL_USUARIO\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

listUsers();
