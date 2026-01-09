
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixRound16Calendar() {
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
        console.log('--- Fixing ROUND_16 Calendar ---');

        // 1. Get Matches
        const matches = await dataSource.query(`
            SELECT id, date, "homeTeam", "awayTeam", "homeTeamPlaceholder", "awayTeamPlaceholder" 
            FROM matches 
            WHERE phase = 'ROUND_16' 
            ORDER BY date ASC, id ASC
        `);

        if (matches.length !== 8) {
            console.warn(`WARNING: Expected 8 matches for ROUND_16, found ${matches.length}. Proceeding anyway.`);
        }

        // 2. Define Target Dates (2 per day from July 4 to July 7)
        // Times: 12:00 and 16:00 to avoid overlap? Or just 12:00 and 15:00.
        // Let's use 15:00 and 20:00 UTC? Or just local times. The user has been using strings like '2026-06-28T12:00:00Z'.
        // I'll set them to fixed ISO times.
        const targetDates = [
            '2026-07-04T12:00:00Z', '2026-07-04T16:00:00Z', // Day 1
            '2026-07-05T12:00:00Z', '2026-07-05T16:00:00Z', // Day 2
            '2026-07-06T12:00:00Z', '2026-07-06T16:00:00Z', // Day 3
            '2026-07-07T12:00:00Z', '2026-07-07T16:00:00Z'  // Day 4
        ];

        // 3. Update Matches
        for (let i = 0; i < matches.length; i++) {
            if (i >= targetDates.length) break; // Should not happen if 8 matches

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

fixRound16Calendar();
