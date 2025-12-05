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

async function promoteUserByActualId() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');

        const userRepository = AppDataSource.getRepository(User);

        // ID del usuario que REALMENTE existe (del log)
        const actualUserId = '06204570-7414-4422-a818-a8b06418c284';

        const user = await userRepository.findOne({ where: { id: actualUserId } });

        if (!user) {
            console.error(`❌ Usuario con ID ${actualUserId} no encontrado`);
            await AppDataSource.destroy();
            process.exit(1);
        }

        console.log('📋 Usuario encontrado:');
        console.log(`   ID: ${user.id}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Nombre: ${user.fullName}`);
        console.log(`   Rol actual: ${user.role}\n`);

        if (user.role === UserRole.SUPER_ADMIN) {
            console.log('✅ El usuario ya es SUPER_ADMIN');
        } else {
            const oldRole = user.role;
            user.role = UserRole.SUPER_ADMIN;
            await userRepository.save(user);

            console.log('\n' + '🎉'.repeat(40));
            console.log('✅ ROL ACTUALIZADO EXITOSAMENTE');
            console.log('═'.repeat(80));
            console.log(`   Rol anterior: ${oldRole}`);
            console.log(`   Rol nuevo: SUPER_ADMIN`);
            console.log('═'.repeat(80));
            console.log('🎉'.repeat(40) + '\n');
            console.log('🔄 Ahora recarga la página del navegador (F5)');
            console.log('📍 Ve a http://localhost:3001/admin');
            console.log('✅ Deberías poder acceder sin problemas\n');
        }

        await AppDataSource.destroy();
        console.log('✅ Script completado exitosamente\n');
    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    }
}

promoteUserByActualId();
