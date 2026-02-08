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

async function promoteMe() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida\n');

    const userRepository = AppDataSource.getRepository(User);

    // Buscar por nickname 'Capitan Arcas'
    let user = await userRepository.findOne({
      where: { nickname: 'Capitan Arcas' },
    });

    // Si no se encuentra, buscar el primer usuario en la base de datos
    if (!user) {
      console.log(
        '⚠️  Usuario "Capitan Arcas" no encontrado, buscando primer usuario...',
      );
      const users = await userRepository.find({ take: 1 });

      if (users.length === 0) {
        console.error('❌ Error: No hay usuarios en la base de datos');
        await AppDataSource.destroy();
        process.exit(1);
      }

      user = users[0];
      console.log(`ℹ️  Usando usuario: ${user.fullName || user.email}\n`);
    }

    // Verificar si ya es admin
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN) {
      console.log(
        `✅ El usuario "${user.fullName || user.nickname}" ya es ${user.role}`,
      );
      await AppDataSource.destroy();
      return;
    }

    // Promover a SUPER_ADMIN (el enum en la DB tiene SUPER_ADMIN, no ADMIN)
    const oldRole = user.role;
    user.role = UserRole.SUPER_ADMIN;
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
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

promoteMe();
