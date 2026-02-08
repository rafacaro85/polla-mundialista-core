import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { TournamentService } from './tournament/tournament.service';

async function promoteAllGroups() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const tournamentService = app.get(TournamentService);

  try {
    console.log('🚀 Ejecutando promoción manual de todos los grupos...\n');
    await tournamentService.promoteAllCompletedGroups();
    console.log('\n✅ Promoción completada!');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await app.close();
  }
}

promoteAllGroups();
