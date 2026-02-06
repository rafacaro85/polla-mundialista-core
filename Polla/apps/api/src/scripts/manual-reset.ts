import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
});

async function manualReset() {
    try {
        console.log('Connecting to DB...');
        await AppDataSource.initialize();
        const queryRunner = AppDataSource.createQueryRunner();
        
        console.log('🧹 [MANUAL RESET] Limpiando marcadores y estados...');

        // 1. Reset Matches
        await queryRunner.query(`
            UPDATE matches 
            SET "homeScore" = NULL, 
                "awayScore" = NULL, 
                "status" = 'PENDING', 
                "isManuallyLocked" = false
        `);
        console.log('✅ Partidos reseteados a PENDING.');

        // 2. Reset Predictions Points
        await queryRunner.query(`UPDATE predictions SET points = 0`);
        console.log('✅ Puntos de predicciones a 0.');

        // 3. Reset Bracket Points
        await queryRunner.query(`UPDATE user_brackets SET points = 0`);
        console.log('✅ Puntos de brackets a 0.');

        // 4. Reset Knockout Phase Status (optional but good for consistency)
        await queryRunner.query(`
            UPDATE knockout_phase_status 
            SET "is_unlocked" = false, 
                "all_matches_completed" = false, 
                "unlocked_at" = NULL
            WHERE phase != 'GROUP' AND phase != 'PLAYOFF'
        `);
        // Re-open initial phases
        await queryRunner.query(`
            UPDATE knockout_phase_status 
            SET "is_unlocked" = true 
            WHERE (phase = 'GROUP' AND "tournamentId" = 'WC2026') 
               OR (phase = 'PLAYOFF' AND "tournamentId" = 'UCL2526')
        `);
        console.log('✅ Estados de fases reiniciados.');

        // 5. Recalculate League Participants Points - SKIPPED FOR NOW to avoid type error
        /*
        console.log('🔄 Recalculando puntos de participantes...');
        
        await queryRunner.query(`
            UPDATE league_participants lp 
            SET prediction_points = (
                SELECT COALESCE(SUM(p.points), 0) 
                FROM predictions p 
                WHERE p.league_id = lp.league_id AND p."userId" = lp.user_id
            )
        `);

        await queryRunner.query(`
            UPDATE league_participants lp 
            SET bracket_points = (
                SELECT COALESCE(SUM(ub.points), 0) 
                FROM user_brackets ub 
                WHERE ub."leagueId" = lp.league_id AND ub."userId" = lp.user_id
            )
        `);
        
        // Update Total - Simplificado para evitar errores de tipo
        await queryRunner.query(`
            UPDATE league_participants 
            SET total_points = 0
        `);
        console.log('✅ Puntos de participantes recalculados (deberían ser 0 + trivia).');
        */
        console.log('⚠️ Puntos de participantes saltados por seguridad.');

        console.log('✨ MANUAL RESET COMPLETADO.');
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error en manual reset:', error);
        process.exit(1);
    }
}

manualReset();
