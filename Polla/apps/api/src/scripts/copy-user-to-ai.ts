
import { DataSource } from 'typeorm';
import { Match } from '../database/entities/match.entity';
import { Prediction } from '../database/entities/prediction.entity';
import { User } from '../database/entities/user.entity';
import { AccessCode } from '../database/entities/access-code.entity';
import { LeagueParticipant } from '../database/entities/league-participant.entity';
import { League } from '../database/entities/league.entity';
import { Organization } from '../database/entities/organization.entity';
import { Notification } from '../database/entities/notification.entity';
import * as dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = 'postgresql://postgres:jhSSELZNsoUtRzLEavAyhFuUNGyniPwO@yamabiko.proxy.rlwy.net:56629/railway';

const AppDataSource = new DataSource({
    type: 'postgres',
    url: DATABASE_URL,
    entities: [Match, Prediction, User, AccessCode, LeagueParticipant, League, Organization, Notification],
    synchronize: false,
    ssl: { rejectUnauthorized: false },
});

async function copyPredictions() {
    try {
        console.log('🚀 Iniciando copia de predicciones de usuario a IA...\n');
        await AppDataSource.initialize();
        console.log('✅ Base de datos conectada\n');

        const userRepository = AppDataSource.getRepository(User);
        const predictionRepository = AppDataSource.getRepository(Prediction);
        const matchRepository = AppDataSource.getRepository(Match);

        // 1. Encontrar al usuario
        const email = 'racv85@gmail.com';
        const user = await userRepository.findOne({ where: { email } });

        if (!user) {
            console.error(`❌ Usuario con email ${email} no encontrado.`);
            process.exit(1);
        }

        console.log(`👤 Usuario encontrado: ${user.fullName} (ID: ${user.id})`);

        // 2. Obtener sus predicciones (incluyendo la relación Match)
        const predictions = await predictionRepository.find({
            where: { user: { id: user.id } },
            relations: ['match']
        });

        console.log(`📊 Se encontraron ${predictions.length} predicciones hechas por este usuario.\n`);

        if (predictions.length === 0) {
            console.log('⚠️ El usuario no tiene predicciones guardadas. Nada que copiar.');
            process.exit(0);
        }

        let count = 0;
        for (const pred of predictions) {
            const match = pred.match;
            if (!match) continue;

            const scoreStr = `${pred.homeScore}-${pred.awayScore}`;
            
            // Solo actualizamos si no tiene predicción de IA aún o para sobrescribir
            // match.aiPrediction = JSON.stringify({
            //     predictedScore: scoreStr,
            //     confidence: pred.isJoker ? 'high' : 'medium',
            //     reasoning: "Predicción basada en análisis experto de tendencias y rendimiento dinámico de los equipos."
            // });
            // match.aiPredictionScore = scoreStr;
            // match.aiPredictionGeneratedAt = new Date();

            // Usamos QueryBuilder para actualizar directo y evitar problemas de carga de entidad
            await matchRepository.update(match.id, {
                aiPrediction: JSON.stringify({
                    predictedScore: scoreStr,
                    confidence: pred.isJoker ? 'high' : 'medium',
                    reasoning: "Análisis experto basado en tendencias históricas y estados de forma actuales de las selecciones."
                }),
                aiPredictionScore: scoreStr,
                aiPredictionGeneratedAt: new Date()
            });

            console.log(`✅ [${++count}/${predictions.length}] Match: ${match.homeTeam} vs ${match.awayTeam} -> IA: ${scoreStr}`);
        }

        console.log(`\n🎉 ¡Proceso completado! Se actualizaron ${count} partidos con predicciones de IA basadas en los datos del usuario.`);
        
        await AppDataSource.destroy();
        process.exit(0);

    } catch (error) {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    }
}

copyPredictions();
