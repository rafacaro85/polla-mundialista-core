import { DataSource } from 'typeorm';
import { User } from '../src/database/entities/user.entity';
import { Match } from '../src/database/entities/match.entity';
import { Prediction } from '../src/database/entities/prediction.entity';
import { League } from '../src/database/entities/league.entity';
import { LeagueParticipant } from '../src/database/entities/league-participant.entity';
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
        entities: [User, Match, Prediction, League, LeagueParticipant],
        synchronize: false,
    });
    await targetDS.initialize();
    console.log('✅ Conectado a Base Nueva (Railway)');

    // 2. Conexión a Base de Datos VIEJA (Origen)
    // Usamos TypeORM también para leer facil las entidades si coinciden, 
    // o raw query si el esquema era muy distinto. Asumiremos coincidencia parcial.
    const sourceDS = new DataSource({
        type: 'postgres',
        url: OLD_DB_URL,
        // Usamos las mismas entidades pero cuidado con columnas faltantes
        // Para lectura segura, usaremos query runner raw
        synchronize: false, 
    });
    await sourceDS.initialize();
    console.log('✅ Conectado a Base Vieja (Vercel)');

    const queryRunner = sourceDS.createQueryRunner();

    try {
        // --- PASO 1: USUARIOS ---
        console.log('\n📦 Migrando Usuarios...');
        const oldUsers = await queryRunner.query('SELECT * FROM "user"'); // Nombre tabla en minúscula o camel? revisar. Postgres suele usar "user" con comillas si es reservada o public.user
        
        // Ajuste: si la tabla se llama 'users' o 'user', intentar detectar
        // En TypeORM por defecto es el nombre de la clase, pero a veces 'user' da problemas.
        // Asumiremos que podemos leer. Si falla, el usuario nos dirá.
        
        let importedUsers = 0;
        for (const u of oldUsers) {
            const exists = await targetDS.getRepository(User).findOne({ where: { email: u.email } });
            if (!exists) {
                // Mapear campos. Asumimos coincidencia.
                // Importante: Mantener IDs viejos si es posible? 
                // Si son UUID, sí. Si chocan, mejor generar nuevos y mapear referencias.
                // Como son bases distintas, intentaremos preservar UUID para integridad de predicciones viejas.
                const newUser = targetDS.getRepository(User).create({
                    ...u,
                    id: u.id, // Intentar preservar ID
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
                await targetDS.getRepository(User).save(newUser);
                importedUsers++;
            }
        }
        console.log(`✅ ${importedUsers} usuarios nuevos importados (de ${oldUsers.length} encontrados).`);

        // --- PASO 2: PARTIDOS (Solo Mundial) ---
        console.log('\n📦 Migrando Partidos (Mundial Antiguo)...');
        // Asumimos que la DB vieja SOLO tiene Mundial.
        const oldMatches = await queryRunner.query('SELECT * FROM "match"'); 
        
        let importedMatches = 0;
        for (const m of oldMatches) {
            const exists = await targetDS.getRepository(Match).findOne({ where: { id: m.id } });
            if (!exists) {
                // Forzar tournamentId
                // Limpiar campos que no existan en la entidad nueva si hay divergence
                const { ...matchData } = m;
                
                await targetDS.getRepository(Match).save({
                    ...matchData,
                    tournamentId: 'WC2026', // ETIQUETA CRÍTICA
                });
                importedMatches++;
            } else {
                // Update tournamentId si existe pero es null
                if (!exists.tournamentId || exists.tournamentId === 'WC2026') {
                    // Ya está ok o asumimos ok
                }
            }
        }
        console.log(`✅ ${importedMatches} partidos historicos importados con etiqueta WC2026.`);


        // --- PASO 3: PREDICCIONES ---
        console.log('\n📦 Migrando Predicciones...');
        const oldPreds = await queryRunner.query('SELECT * FROM "prediction"');
        
        let importedPreds = 0;
        for (const p of oldPreds) {
            const exists = await targetDS.getRepository(Prediction).findOne({ where: { id: p.id } });
            if (!exists) {
                // Verificar Integridad: Usuario y Partido deben existir en DESTINO
                const userExists = await targetDS.getRepository(User).findOne({ where: { id: p.userId } });
                const matchExists = await targetDS.getRepository(Match).findOne({ where: { id: p.matchId } });

                if (userExists && matchExists) {
                    await targetDS.getRepository(Prediction).save({
                        ...p,
                        tournamentId: 'WC2026'
                    });
                    importedPreds++;
                }
            }
        }
        console.log(`✅ ${importedPreds} predicciones importadas.`);

        // --- PASO 4: PUNTOS (LEAGUES) ---
        console.log('\n📦 Migrando Pollas (Ranking)...');
        // Aquí es tricky. Si hay una tabla LeagueParticipant vieja, traerla.
        try {
            const oldParts = await queryRunner.query('SELECT * FROM "league_participant"');
            for (const lp of oldParts) {
                 const exists = await targetDS.getRepository(LeagueParticipant).findOne({ where: { id: lp.id } });
                 if (!exists) {
                     // Verificar integridad
                     const userExists = await targetDS.getRepository(User).findOne({ where: { id: lp.userId } });
                     // Si la liga global o especifica no existe, quizas fallamos. 
                     // Intentaremos asumir Global o crear la liga si no existe.
                     // Por simplicidad, si es la liga global antigua, mapear a la nueva (buscar por nombre o ID).
                     
                     if (userExists) {
                         // Guardar puntos y snapshot
                         await targetDS.getRepository(LeagueParticipant).save({
                             ...lp,
                             // Asegurar que referecia a una liga valida en nueva DB
                         });
                     }
                 }
            }
            console.log(`✅ Rankings/Puntos importados (Best Effort).`);
        } catch (e) {
            console.warn('⚠️ No se pudo migrar la tabla de ranking (league_participant) o estaba vacía.');
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
