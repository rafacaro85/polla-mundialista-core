import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { MatchesService } from './matches/matches.service';

async function seedKnockout() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const matchesService = app.get(MatchesService);

  try {
    console.log('🌱 Iniciando seeding de llaves (R32 y R16)...');
    const result = await matchesService.seedRound32();
    console.log('✅', result.message);
    console.log(`📊 Partidos creados: ${result.created}`);
  } catch (error) {
    console.error('❌ Error durante el seeding:', error);
  } finally {
    await app.close();
  }
}

seedKnockout();
