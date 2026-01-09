
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixColombia() {
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
        console.log('DB Conectada.');

        // 1. Colombia vs Uzbekistán (Ganar 3-0)
        await dataSource.query(`
            UPDATE matches 
            SET "homeScore" = 3, "awayScore" = 0, status = 'FINISHED', "isLocked" = true
            WHERE "homeTeam" = 'Colombia' AND "awayTeam" = 'Uzbekistán'
        `);
        console.log('✅ Colombia 3 - 0 Uzbekistán');

        // 2. Colombia vs Repechaje K (Ganar 2-1)
        await dataSource.query(`
            UPDATE matches 
            SET "homeScore" = 2, "awayScore" = 1, status = 'FINISHED', "isLocked" = true
            WHERE "homeTeam" = 'Colombia' AND "awayTeam" = 'Repechaje K'
        `);
        console.log('✅ Colombia 2 - 1 Repechaje K');

        // 3. Portugal vs Colombia (Perder 1-2) - Ya estaba 4-1, lo dejamos así o ajustamos.
        // Dejemos que pierda contra Portugal para que sea "2 ganados de 3".

        console.log('Corrección aplicada. Colombia ahora tiene 2 victorias.');

    } catch (e) {
        console.error(e);
    } finally {
        await dataSource.destroy();
    }
}

fixColombia();
