
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function cleanupPhases() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'admin123',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        entities: ['src/database/entities/*.entity.ts'],
        ssl: false,
    });

    try {
        await dataSource.initialize();

        // 1. Asegurar que partidos del 4 de julio en adelante sean ROUND_16 (Octavos)
        // Esto arregla si se colaron como ROUND_32
        const result = await dataSource.query(`
            UPDATE matches 
            SET phase = 'ROUND_16' 
            WHERE phase = 'ROUND_32' AND date >= '2026-07-04'
        `);
        console.log(`Corregidos ${result[1]} partidos mal etiquetados como ROUND_32 en fechas de Octavos.`);

        // 2. Verificar fases desbloqueadas
        const unlocked = await dataSource.query(`SELECT phase FROM knockout_phase_status WHERE is_unlocked = true`);
        console.log('Fases actualmente desbloqueadas:', unlocked.map((u: any) => u.phase));

    } catch (e) { console.error(e); } finally { await dataSource.destroy(); }
}
cleanupPhases();
