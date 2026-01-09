
import { DataSource } from 'typeorm';
import { Match } from './database/entities/match.entity';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixCalendar() {
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
        const repo = dataSource.getRepository(Match);

        // 1. Diagnóstico del 4 de Julio
        const july4 = await repo.find({
            where: { date: new Date('2026-07-04T16:00:00.000Z') }, // Asumiendo hora 16:00
            select: ['id', 'phase', 'homeTeamPlaceholder']
        });
        if (july4.length === 0) {
            // Try searching range
            const start = new Date('2026-07-04T00:00:00Z');
            const end = new Date('2026-07-04T23:59:59Z');
            const july4Range = await dataSource.query(`SELECT id, phase, "homeTeamPlaceholder" FROM matches WHERE date >= $1 AND date <= $2`, [start, end]);
            console.log('Partidos del 4 de Julio (Range):', july4Range);
        } else {
            console.log('Partidos del 4 de Julio (Exact):', july4);
        }

        // 2. Corregir Calendario ROUND_32 (FIFA Schedule)
        // 28 Jun: 1 partido
        // 29 Jun: 3 partidos
        // 30 Jun: 3 partidos
        // 01 Jul: 3 partidos
        // 02 Jul: 3 partidos
        // 03 Jul: 3 partidos
        const r32Matches = await repo.find({
            where: { phase: 'ROUND_32' },
            order: { bracketId: 'ASC' } // Usar bracketId para mantener orden lógico, o id si bracketId falta
        });

        console.log(`Encontrados ${r32Matches.length} partidos de ROUND_32 para reagendar.`);

        // Mapa de fechas y cantidad de partidos
        const schedule = [
            { date: '2026-06-28T16:00:00Z', count: 1 },
            { date: '2026-06-29T16:00:00Z', count: 3 },
            { date: '2026-06-30T16:00:00Z', count: 3 },
            { date: '2026-07-01T16:00:00Z', count: 3 },
            { date: '2026-07-02T16:00:00Z', count: 3 },
            { date: '2026-07-03T16:00:00Z', count: 3 },
        ];

        let matchIndex = 0;
        for (const day of schedule) {
            for (let i = 0; i < day.count; i++) {
                if (matchIndex < r32Matches.length) {
                    r32Matches[matchIndex].date = new Date(day.date);
                    await repo.save(r32Matches[matchIndex]);
                    matchIndex++;
                }
            }
        }
        console.log('✅ Calendario ROUND_32 actualizado a fechas FIFA (28 Jun - 03 Jul).');

    } catch (e) { console.error(e); } finally { await dataSource.destroy(); }
}
fixCalendar();
