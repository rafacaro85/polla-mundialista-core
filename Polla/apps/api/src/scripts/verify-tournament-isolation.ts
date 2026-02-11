import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Match],
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
      entities: [Match],
      synchronize: false,
    });

async function verify() {
  try {
    await AppDataSource.initialize();
    console.log('🔍 Verificando Aislamiento de Torneos...');

    const matchRepository = AppDataSource.getRepository(Match);

    // Count WC2026 Matches
    const wcCount = await matchRepository.count({
      where: { tournamentId: 'WC2026' },
    });

    // Count UCL2526 Matches
    const uclCount = await matchRepository.count({
      where: { tournamentId: 'UCL2526' },
    });

    // Check for anomalies (null or other IDs)
    const anomalies = await matchRepository
      .createQueryBuilder('m')
      .where("m.tournamentId NOT IN ('WC2026', 'UCL2526')")
      .getCount();

    console.log('\n📊 REPORTE DE ESTADO:');
    console.log('---------------------');
    console.log(`🏆 Mundial 2026 (WC2026):      ${wcCount} partidos`);
    console.log(`🇪🇺 Champions (UCL2526):       ${uclCount} partidos`);
    console.log('---------------------');

    if (anomalies > 0) {
      console.error(`⚠️  ALERTA: Se encontraron ${anomalies} partidos con IDs desconocidos!`);
    } else {
      console.log('✅ Integridad de IDs: PERFECTA (0 anomalías)');
    }

    if (wcCount > 0 && uclCount > 0) {
      console.log('\n✅ CONCLUSIÓN: Coexistencia Exitosa. Los torneos están aislados.');
    } else if (uclCount === 0) {
      console.log('\n⚠️  CONCLUSIÓN: Champions aún no inyectada.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    process.exit(1);
  }
}

verify();
