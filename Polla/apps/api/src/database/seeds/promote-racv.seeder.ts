import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserRole } from '../enums/user-role.enum';
import { Prediction } from '../entities/prediction.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { Match } from '../entities/match.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        User,
        Prediction,
        AccessCode,
        LeagueParticipant,
        Match,
        League,
        Organization,
      ],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
      entities: [
        User,
        Prediction,
        AccessCode,
        LeagueParticipant,
        Match,
        League,
        Organization,
      ],
      synchronize: false,
    });

async function promoteToAdmin() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    const userRepository = AppDataSource.getRepository(User);

    const email = 'racv85@gmail.com';
    console.log(`🔍 Buscando usuario con email: ${email}`);

    const user = await userRepository.findOne({ where: { email } });

    if (!user) {
      console.error(`❌ No se encontró ningún usuario con el email: ${email}`);
      console.log(
        '💡 Asegúrate de haber iniciado sesión al menos una vez en la aplicación',
      );
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.fullName} (${user.email})`);

    if (user.role === UserRole.SUPER_ADMIN) {
      console.log('✅ El usuario ya es SUPER_ADMIN');
    } else {
      user.role = UserRole.SUPER_ADMIN;
      await userRepository.save(user);
      console.log('🎉 ¡Usuario promovido a SUPER_ADMIN exitosamente!');
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Información del usuario:');
    console.log(`   Nombre: ${user.fullName}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Rol: ${user.role}`);
    console.log('='.repeat(60));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

promoteToAdmin();
