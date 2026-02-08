import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import { UserRole } from '../enums/user-role.enum';
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

async function promoteAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    const userRepository = AppDataSource.getRepository(User);

    // Obtener email del usuario a promover (primer argumento del comando)
    const email = process.argv[2];

    if (!email) {
      console.error('❌ Error: Debes proporcionar un email');
      console.log('Uso: npm run seed:promote-admin -- usuario@ejemplo.com');
      process.exit(1);
    }

    // Buscar usuario por email
    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ Error: Usuario con email "${email}" no encontrado`);
      process.exit(1);
    }

    // Verificar si ya es admin
    if (user.role === UserRole.ADMIN) {
      console.log(`ℹ️  El usuario "${user.fullName}" (${email}) ya es ADMIN`);
      await AppDataSource.destroy();
      return;
    }

    // Promover a ADMIN
    user.role = UserRole.ADMIN;
    await userRepository.save(user);

    console.log('✅ Usuario promovido exitosamente');
    console.log(`   - Nombre: ${user.fullName}`);
    console.log(`   - Email: ${email}`);
    console.log(
      `   - Rol anterior: ${user.role === UserRole.ADMIN ? 'PLAYER' : user.role}`,
    );
    console.log(`   - Rol actual: ADMIN`);

    await AppDataSource.destroy();
    console.log('✅ Script completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

promoteAdmin();
