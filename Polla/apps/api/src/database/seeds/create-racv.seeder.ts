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
    entities: [User, Match, Prediction, AccessCode, LeagueParticipant, League, Organization],
    synchronize: false,
});

async function createRacvUser() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');

        const userRepository = AppDataSource.getRepository(User);

        // Verificar si ya existe
        let user = await userRepository.findOne({ where: { email: 'racv85@gmail.com' } });

        if (user) {
            console.log('⚠️  El usuario racv85@gmail.com ya existe');
            console.log(`   Rol actual: ${user.role}`);

            if (user.role !== UserRole.SUPER_ADMIN) {
                user.role = UserRole.SUPER_ADMIN;
                await userRepository.save(user);
                console.log('✅ Usuario promovido a SUPER_ADMIN');
            }
        } else {
            // Crear el usuario manualmente
            user = userRepository.create({
                email: 'racv85@gmail.com',
                fullName: 'Rafael Caro',
                nickname: 'Rafa',
                googleId: 'racv85@gmail.com',
                avatarUrl: 'https://lh3.googleusercontent.com/a/default',
                role: UserRole.SUPER_ADMIN,
            });

            await userRepository.save(user);

            console.log('\n' + '🎉'.repeat(30));
            console.log('👑 ¡USUARIO CREADO Y PROMOVIDO A SUPER_ADMIN! 👑');
            console.log('═'.repeat(60));
            console.log(`   📧 Email: racv85@gmail.com`);
            console.log(`   👤 Nombre: Rafael Caro`);
            console.log(`   🏷️  Nickname: Rafa`);
            console.log(`   ⭐ Rol: SUPER_ADMIN`);
            console.log('═'.repeat(60));
            console.log('🎉'.repeat(30) + '\n');
        }

        await AppDataSource.destroy();
        console.log('✅ Script completado exitosamente\n');
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

createRacvUser();
