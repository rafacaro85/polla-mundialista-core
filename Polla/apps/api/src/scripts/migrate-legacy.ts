import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../database/entities/user.entity';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { League } from '../database/entities/league.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { config } from 'dotenv';

config();

// CONFIGURACIÓN: Pega aquí la URL de la base de datos ANTIGUA (Vercel)
const OLD_DB_URL = process.env.OLD_DATABASE_URL;
const NEW_DB_URL = process.env.DATABASE_URL;

if (!OLD_DB_URL) {
  console.error('❌ Falta OLD_DATABASE_URL en el archivo .env');
  process.exit(1);
}

async function runMigration() {
  console.log('🚀 Iniciando Migración de Legado (Vercel -> Railway)...');

  // 1. Conexión a Base de Datos NUEVA (Destino)
  const targetDS = new DataSource({
    type: 'postgres',
    url: NEW_DB_URL,
    entities: [__dirname + '/../database/entities/*.entity.ts'],
    synchronize: false,
    ssl: { rejectUnauthorized: false }, // REQUIRED FOR RAILWAY
  });
  await targetDS.initialize();
  console.log('✅ Conectado a Base Nueva (Railway)');

  // 2. Conexión a Base de Datos VIEJA (Origen)
  const sourceDS = new DataSource({
    type: 'postgres',
    url: OLD_DB_URL,
    entities: [], // Empty for Raw Queries
    synchronize: false,
    ssl: { rejectUnauthorized: false }, // REQUIRED FOR RAILWAY
  });
  await sourceDS.initialize();
  console.log('✅ Conectado a Base Vieja (Vercel)');

  const queryRunner = sourceDS.createQueryRunner();

  try {
    // --- PASO 1: USUARIOS ---
    console.log('\n📦 Migrando Usuarios...');
    const oldUsers = await queryRunner.query('SELECT * FROM "users"'); // CORREGIDO: PLURAL

    let importedUsers = 0;
    let updatedUsers = 0;

    if (oldUsers.length > 0) {
      console.log(
        '🔍 [DEBUG] KEY CHECK - First User:',
        Object.keys(oldUsers[0]),
      );
      console.log('🔍 [DEBUG] RAW USER SAMPLE:', oldUsers[0]);
    }
    for (const u of oldUsers) {
      const exists = await targetDS
        .getRepository(User)
        .findOne({ where: { email: u.email } });

      // Build user object from raw data
      const userData = {
        ...u,
        id: u.id,
        // PROTECCIÓN CONTRA DESBORDAMIENTO (Truncar str a 100 chars)
        // Intentamos mapear múltiples posibles nombres de columna
        // FIX: Prioritize 'full_name' as seen in legacy DB inspection
        fullName: (
          u.full_name ||
          u.fullName ||
          u.name ||
          u.nombre ||
          u.nombres ||
          (u.firstName ? `${u.firstName} ${u.lastName}` : '') ||
          'Unknown'
        ).substring(0, 99),
        nickname: (
          u.nickname ||
          u.username ||
          u.alias ||
          u.email.split('@')[0]
        ).substring(0, 99),
        phoneNumber: (
          u.phoneNumber ||
          u.phone_number ||
          u.phone ||
          u.celular ||
          u.mobile ||
          u.telefono ||
          ''
        ).substring(0, 20),
        updatedAt: new Date(),
      };

      if (!exists) {
        const newUser = targetDS.getRepository(User).create({
          ...userData,
          createdAt: new Date(),
        });

        try {
          await targetDS.getRepository(User).save(newUser);
          importedUsers++;
        } catch (err) {
          console.error(`⚠️ Error importando usuario ${u.email}:`, err.message);
        }
      } else {
        // UPDATE if exists (Fix missing names)
        if (exists.fullName === 'Unknown' || !exists.phoneNumber) {
          await targetDS.getRepository(User).update(
            { id: exists.id },
            {
              fullName: userData.fullName,
              nickname: userData.nickname,
              phoneNumber: userData.phoneNumber,
            },
          );
          updatedUsers++;
        }
      }
    }
    console.log(`✅ ${importedUsers} usuarios nuevos importados.`);
    console.log(
      `✅ ${updatedUsers} usuarios existentes actualizados (corregidos).`,
    );
    console.log(
      `✅ ${importedUsers} usuarios nuevos importados (de ${oldUsers.length} encontrados).`,
    );

    // --- PASO 2: PARTIDOS (Solo Mundial) ---
    console.log('\n📦 Migrando Partidos (Mundial Antiguo)...');
    const oldMatches = await queryRunner.query('SELECT * FROM "matches"'); // CORREGIDO: PLURAL

    let importedMatches = 0;
    for (const m of oldMatches) {
      const exists = await targetDS
        .getRepository(Match)
        .findOne({ where: { id: m.id } });
      if (!exists) {
        const { ...matchData } = m;
        await targetDS.getRepository(Match).save({
          ...matchData,
          tournamentId: 'WC2026', // ETIQUETA CRÍTICA
        });
        importedMatches++;
      }
    }
    console.log(
      `✅ ${importedMatches} partidos historicos importados con etiqueta WC2026.`,
    );

    // --- PASO 3: PREDICCIONES ---
    console.log('\n📦 Migrando Predicciones...');
    const oldPreds = await queryRunner.query('SELECT * FROM "predictions"'); // CORREGIDO: PLURAL

    let importedPreds = 0;
    for (const p of oldPreds) {
      const exists = await targetDS
        .getRepository(Prediction)
        .findOne({ where: { id: p.id } });
      if (!exists) {
        const userExists = await targetDS
          .getRepository(User)
          .findOne({ where: { id: p.userId } });
        const matchExists = await targetDS
          .getRepository(Match)
          .findOne({ where: { id: p.matchId } });

        if (userExists && matchExists) {
          await targetDS.getRepository(Prediction).save({
            ...p,
            tournamentId: 'WC2026',
          });
          importedPreds++;
        }
      }
    }
    console.log(`✅ ${importedPreds} predicciones importadas.`);

    // --- PASO 4: PUNTOS (LEAGUES) ---
    console.log('\n📦 Migrando Pollas (Ranking)...');
    try {
      const oldParts = await queryRunner.query(
        'SELECT * FROM "league_participants"',
      ); // CORREGIDO: PLURAL
      for (const lp of oldParts) {
        const exists = await targetDS
          .getRepository(LeagueParticipant)
          .findOne({ where: { id: lp.id } });
        if (!exists) {
          const userExists = await targetDS
            .getRepository(User)
            .findOne({ where: { id: lp.userId } });

          if (userExists) {
            await targetDS.getRepository(LeagueParticipant).save({
              ...lp,
            });
          }
        }
      }
      console.log(`✅ Rankings/Puntos importados (Best Effort).`);
    } catch (e) {
      console.warn(
        '⚠️ No se pudo migrar la tabla de ranking (league_participants) o estaba vacía.',
      );
    }
  } catch (error) {
    console.error('❌ Error fatal durante la migración:', error);
  } finally {
    await sourceDS.destroy();
    await targetDS.destroy();
    console.log('👋 Migración finalizada.');
  }
}

runMigration();
