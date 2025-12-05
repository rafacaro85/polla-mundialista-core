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

async function promoteRacv() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Conexión a la base de datos establecida\n');

        const userRepository = AppDataSource.getRepository(User);

        // BÚSQUEDA EXACTA por email
        const targetEmail = 'racv85@gmail.com';
        const user = await userRepository.findOne({
            where: { email: targetEmail }
        });

        // VALIDACIÓN - Si no existe, error gigante
        if (!user) {
            console.error('\n' + '🔴'.repeat(30));
            console.error('❌❌❌ ¡CORREO NO ENCONTRADO! ❌❌❌');
            console.error(`❌ El usuario con email "${targetEmail}" NO EXISTE en la base de datos`);
            console.error('❌ Debes iniciar sesión primero con Google usando ese correo');
            console.error('🔴'.repeat(30) + '\n');
            await AppDataSource.destroy();
            process.exit(1);
        }

        // Verificar si ya es admin
        if (user.role === UserRole.SUPER_ADMIN) {
            console.log('\n' + '👑'.repeat(30));
            console.log(`✅ ${targetEmail} YA ES EL DUEÑO DEL JUEGO`);
            console.log(`✅ Rol actual: ${user.role}`);
            console.log('👑'.repeat(30) + '\n');
            await AppDataSource.destroy();
            return;
        }

        // ACCIÓN - Promover a SUPER_ADMIN
        const oldRole = user.role;
        user.role = UserRole.SUPER_ADMIN;
        await userRepository.save(user);

        // FEEDBACK - Mensaje épico
        console.log('\n' + '🎉'.repeat(30));
        console.log('👑👑👑 ¡ASCENSO COMPLETADO! 👑👑👑');
        console.log('═'.repeat(60));
        console.log(`   👤 Usuario: ${user.fullName || user.nickname || 'N/A'}`);
        console.log(`   📧 Email: ${targetEmail}`);
        console.log(`   🔄 Rol anterior: ${oldRole}`);
        console.log(`   ⭐ Rol actual: SUPER_ADMIN`);
        console.log('═'.repeat(60));
        console.log('👑 ¡racv85@gmail.com ahora es el DUEÑO DEL JUEGO! 👑');
        console.log('🎉'.repeat(30) + '\n');

        await AppDataSource.destroy();
        console.log('✅ Script completado exitosamente\n');
    } catch (error) {
        console.error('\n❌ Error inesperado:', error);
        process.exit(1);
    }
}

promoteRacv();
