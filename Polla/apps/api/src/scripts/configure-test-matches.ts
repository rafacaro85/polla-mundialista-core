import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
    });

async function configureTestMatches() {
  try {
    // ⚠️ CONFIGURACIÓN - ACTUALIZA ESTOS VALORES
    const MATCH_1_FIXTURE_ID = 0; // Girona vs Barcelona
    const MATCH_1_HOME = 'Girona';
    const MATCH_1_AWAY = 'FC Barcelona';
    const MATCH_1_TIME = '2026-02-16T20:00:00Z'; // UTC
    const MATCH_1_STADIUM = 'Estadi Montilivi';
    const MATCH_1_HOME_LOGO =
      'https://media.api-sports.io/football/teams/547.png';
    const MATCH_1_AWAY_LOGO =
      'https://media.api-sports.io/football/teams/529.png';

    const MATCH_2_FIXTURE_ID = 0; // Cagliari vs Lecce
    const MATCH_2_HOME = 'Cagliari';
    const MATCH_2_AWAY = 'Lecce';
    const MATCH_2_TIME = '2026-02-16T19:45:00Z'; // UTC
    const MATCH_2_STADIUM = 'Unipol Domus';
    const MATCH_2_HOME_LOGO =
      'https://media.api-sports.io/football/teams/488.png';
    const MATCH_2_AWAY_LOGO =
      'https://media.api-sports.io/football/teams/867.png';

    if (MATCH_1_FIXTURE_ID === 0 || MATCH_2_FIXTURE_ID === 0) {
      console.error('❌ ERROR: Debes configurar los Fixture IDs primero!');
      console.error(
        '   Edita este archivo y actualiza MATCH_1_FIXTURE_ID y MATCH_2_FIXTURE_ID',
      );
      console.error('\n💡 Para obtener los IDs:');
      console.error('   1. Ve a https://www.api-football.com/');
      console.error('   2. Busca "Girona vs Barcelona" y "Cagliari vs Lecce"');
      console.error('   3. Copia los Fixture IDs');
      process.exit(1);
    }

    await AppDataSource.initialize();
    console.log('✅ Connected to Database\n');

    // Get test tournament matches
    const matches = await AppDataSource.query(`
      SELECT id, "homeTeam", "awayTeam" 
      FROM matches 
      WHERE "tournamentId" = 'TEST_LIVE_MONDAY'
      ORDER BY id
      LIMIT 2
    `);

    if (matches.length < 2) {
      console.error(
        '❌ No se encontraron suficientes partidos en TEST_LIVE_MONDAY',
      );
      process.exit(1);
    }

    console.log('🔄 Actualizando partidos...\n');

    // Update Match 1 (Girona vs Barcelona)
    await AppDataSource.query(
      `
      UPDATE matches 
      SET 
        "externalId" = $1,
        "homeTeam" = $2,
        "awayTeam" = $3,
        date = $4,
        stadium = $5,
        "homeFlag" = $6,
        "awayFlag" = $7,
        "group" = 'LALIGA TEST'
      WHERE id = $8
    `,
      [
        MATCH_1_FIXTURE_ID,
        MATCH_1_HOME,
        MATCH_1_AWAY,
        MATCH_1_TIME,
        MATCH_1_STADIUM,
        MATCH_1_HOME_LOGO,
        MATCH_1_AWAY_LOGO,
        matches[0].id,
      ],
    );

    console.log(`✅ Partido 1 actualizado:`);
    console.log(`   ${MATCH_1_HOME} vs ${MATCH_1_AWAY}`);
    console.log(`   Fixture ID: ${MATCH_1_FIXTURE_ID}`);
    console.log(`   Hora: ${MATCH_1_TIME}\n`);

    // Update Match 2 (Cagliari vs Lecce)
    await AppDataSource.query(
      `
      UPDATE matches 
      SET 
        "externalId" = $1,
        "homeTeam" = $2,
        "awayTeam" = $3,
        date = $4,
        stadium = $5,
        "homeFlag" = $6,
        "awayFlag" = $7,
        "group" = 'SERIE A TEST'
      WHERE id = $8
    `,
      [
        MATCH_2_FIXTURE_ID,
        MATCH_2_HOME,
        MATCH_2_AWAY,
        MATCH_2_TIME,
        MATCH_2_STADIUM,
        MATCH_2_HOME_LOGO,
        MATCH_2_AWAY_LOGO,
        matches[1].id,
      ],
    );

    console.log(`✅ Partido 2 actualizado:`);
    console.log(`   ${MATCH_2_HOME} vs ${MATCH_2_AWAY}`);
    console.log(`   Fixture ID: ${MATCH_2_FIXTURE_ID}`);
    console.log(`   Hora: ${MATCH_2_TIME}\n`);

    console.log('\n🎯 ¡Listo! Los partidos están configurados.');
    console.log('\n📋 Próximos pasos:');
    console.log('1. Navega a /dashboard');
    console.log('2. Selecciona "⚙️ System Config (Admin Only)"');
    console.log('3. Haz predicciones');
    console.log('4. Monitorea los logs para ver el sync en acción');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

configureTestMatches();
