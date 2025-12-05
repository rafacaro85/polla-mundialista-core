import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MatchesService } from './matches/matches.service';

async function resetKnockout() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const matchesService = app.get(MatchesService);

    try {
        console.log('🔄 Reseteando partidos de octavos...');
        const result = await matchesService.resetKnockoutMatches();
        console.log('✅', result.message);
        console.log(`📊 Partidos reseteados: ${result.reset}`);
    } catch (error) {
        console.error('❌ Error durante el reseteo:', error);
    } finally {
        await app.close();
    }
}

resetKnockout();
