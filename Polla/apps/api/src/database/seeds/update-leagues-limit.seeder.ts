import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { League } from '../entities/league.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);
    const leagueRepository = dataSource.getRepository(League);

    console.log('🚀 Iniciando migración de límites de liga...');

    try {
        const result = await leagueRepository
            .createQueryBuilder()
            .update(League)
            .set({ maxParticipants: 3 })
            .where('maxParticipants IS NULL OR maxParticipants = 100') // Update nulls or old default
            .execute();

        console.log(`✅ Migración completada. Ligas actualizadas: ${result.affected}`);
    } catch (error) {
        console.error('❌ Error durante la migración:', error);
    } finally {
        await app.close();
    }
}

bootstrap();
