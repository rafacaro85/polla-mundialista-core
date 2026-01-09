
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixQuarterCalendar() {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'admin123',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        ssl: false,
    });

    try {
        await dataSource.initialize();
        console.log('--- Fixing QUARTER Calendar ---');

        // 1. Get Matches
        const matches = await dataSource.query(`
            SELECT id, date, "homeTeam", "awayTeam", "homeTeamPlaceholder", "awayTeamPlaceholder" 
            FROM matches 
            WHERE phase = 'QUARTER' 
            ORDER BY date ASC, id ASC
        `);

        if (matches.length !== 4) {
            console.warn(`WARNING: Expected 4 matches for QUARTER, found ${matches.length}. Proceeding anyway.`);
        }

        // 2. Define Target Dates
        // July 9: 1 match
        // July 10: 1 match
        // July 11: 2 matches
        const targetDates = [
            '2026-07-09T19:00:00Z', // July 9
            '2026-07-10T19:00:00Z', // July 10
            '2026-07-11T17:00:00Z', // July 11 (Match 1)
            '2026-07-11T21:00:00Z'  // July 11 (Match 2)
        ];

        // 3. Update Matches
        for (let i = 0; i < matches.length; i++) {
            if (i >= targetDates.length) break;

            const match = matches[i];
            const newDate = targetDates[i];

            await dataSource.query(`
                UPDATE matches 
                SET date = $1 
                WHERE id = $2
            `, [newDate, match.id]);

            console.log(`Updated Match ${match.id} (${match.homeTeamPlaceholder || 'H'} vs ${match.awayTeamPlaceholder || 'A'}) to ${newDate}`);
        }

        console.log('--- Fix Complete ---');

    } catch (e) {
        console.error('Error during fix:', e);
    } finally {
        if (dataSource.isInitialized) await dataSource.destroy();
    }
}

fixQuarterCalendar();
