import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MatchesService } from './matches/matches.service';

async function seedKnockout() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const matchesService = app.get(MatchesService);

    try {
        console.log('🌱 Iniciando seeding de partidos de octavos...');
        const result = await matchesService.seedKnockoutMatches();
        console.log('✅', result.message);
        console.log(`📊 Partidos creados: ${result.created}`);
    } catch (error) {
        console.error('❌ Error durante el seeding:', error);
    } finally {
        await app.close();
    }
}

seedKnockout();
