import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Cargar variables de entorno
dotenv.config({ path: join(__dirname, '../../.env') });

async function resetWCPhases() {
const dataSource = new DataSource({
    type: 'postgres',
    url: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway",
    ssl: { rejectUnauthorized: false },
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Conexión establecida.');

    const tournamentId = 'WC2026';

    // 1. Resetear todas las fases del Mundial
    console.log(`\n🔄 Reseteando estados de fases para ${tournamentId}...`);
    
    // El nombre de la tabla es knockout_phase_status
    const result = await dataSource.query(`
      UPDATE knockout_phase_status 
      SET 
        is_unlocked = CASE WHEN phase = 'GROUP' THEN true ELSE false END,
        all_matches_completed = false,
        unlocked_at = CASE WHEN phase = 'GROUP' THEN now() ELSE null END
      WHERE "tournamentId" = $1
    `, [tournamentId]);

    console.log('✅ Resultado del reset:', result);

    // 2. Verificar cómo quedaron
    const phases = await dataSource.query(`
      SELECT phase, is_unlocked, all_matches_completed 
      FROM knockout_phase_status 
      WHERE "tournamentId" = $1
      ORDER BY id ASC
    `, [tournamentId]);

    console.log('\n📊 Estado actual de las fases:');
    console.log(JSON.stringify(phases, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
  }
}

resetWCPhases();
