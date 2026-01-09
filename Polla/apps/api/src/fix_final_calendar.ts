
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function fixFinalPhases() {
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
        console.log('--- Fixing SEMI, FINAL and 3RD_PLACE ---');

        // 1. Fix SEMI Dates
        const semis = await dataSource.query(`SELECT id FROM matches WHERE phase = 'SEMI' ORDER BY date ASC`);

        if (semis.length >= 2) {
            await dataSource.query(`UPDATE matches SET date = '2026-07-14T20:00:00Z' WHERE id = $1`, [semis[0].id]);
            await dataSource.query(`UPDATE matches SET date = '2026-07-15T20:00:00Z' WHERE id = $1`, [semis[1].id]);
            console.log('Fixed SEMI dates (Jul 14, Jul 15)');
        } else {
            console.warn('Found fewer than 2 SEMI matches', semis.length);
        }

        // 2. Fix FINAL Date
        const finals = await dataSource.query(`SELECT id FROM matches WHERE phase = 'FINAL'`);
        if (finals.length > 0) {
            await dataSource.query(`UPDATE matches SET date = '2026-07-19T20:00:00Z' WHERE id = $1`, [finals[0].id]);
            console.log('Fixed FINAL date (Jul 19)');
        }

        // 3. Check and Create 3RD_PLACE
        const thirdPlace = await dataSource.query(`SELECT * FROM matches WHERE phase = '3RD_PLACE'`);
        if (thirdPlace.length === 0) {
            console.log('Creating 3RD_PLACE match...');
            await dataSource.query(`
                INSERT INTO matches (
                   id, "homeTeam", "awayTeam", "homeTeamPlaceholder", "awayTeamPlaceholder", 
                   phase, date, status, "isLocked", "createdAt", "updatedAt"
                ) VALUES (
                   uuid_generate_v4(), 'TBD', 'TBD', 'Loser Match 101', 'Loser Match 102',
                   '3RD_PLACE', '2026-07-18T20:00:00Z', 'SCHEDULED', false, NOW(), NOW()
                )
            `);
            console.log('Created 3RD_PLACE match (Jul 18)');
        } else {
            await dataSource.query(`UPDATE matches SET date = '2026-07-18T20:00:00Z' WHERE phase = '3RD_PLACE'`);
            console.log('Fixed 3RD_PLACE date (Jul 18)');
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (dataSource.isInitialized) await dataSource.destroy();
    }
}

fixFinalPhases();
