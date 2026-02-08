import { DataSource } from 'typeorm';
import { Match } from '../entities/match.entity';
import { Prediction } from '../entities/prediction.entity';
import { User } from '../entities/user.entity';
import { AccessCode } from '../entities/access-code.entity';
import { LeagueParticipant } from '../entities/league-participant.entity';
import { League } from '../entities/league.entity';
import { Organization } from '../entities/organization.entity';
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
    Match,
    Prediction,
    User,
    AccessCode,
    LeagueParticipant,
    League,
    Organization,
  ],
  synchronize: false,
});

async function resetMatches() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Conexión a la base de datos establecida');

    const matchRepository = AppDataSource.getRepository(Match);

    // Obtener todos los partidos
    const matches = await matchRepository.find();
    console.log(`📊 Encontrados ${matches.length} partidos`);

    // Fecha futura (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0); // 8 PM

    // Reiniciar cada partido
    for (const match of matches) {
      match.status = 'SCHEDULED';
      match.homeScore = null;
      match.awayScore = null;
      match.date = tomorrow;
      await matchRepository.save(match);
    }

    console.log('✅ Todos los partidos han sido reiniciados');
    console.log('   - Status: SCHEDULED');
    console.log('   - Scores: null');
    console.log('   - Fecha: Mañana 8 PM');

    // Eliminar todas las predicciones usando query builder
    const predictionRepository = AppDataSource.getRepository(Prediction);
    const deleteResult = await predictionRepository
      .createQueryBuilder()
      .delete()
      .execute();
    console.log(`🗑️  Eliminadas ${deleteResult.affected || 0} predicciones`);

    await AppDataSource.destroy();
    console.log('✅ Script completado exitosamente');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetMatches();
