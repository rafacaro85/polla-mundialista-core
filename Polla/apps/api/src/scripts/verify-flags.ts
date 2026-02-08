import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Match } from '../database/entities/match.entity';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
});

async function verify() {
    try {
        await AppDataSource.initialize();
        console.log('🔍 Checking flags in DB...');

        const queryRunner = AppDataSource.createQueryRunner();
        const matches = await queryRunner.query(`
            SELECT "homeTeam", "homeFlag", "awayTeam", "awayFlag", "tournamentId"
            FROM matches 
            WHERE "tournamentId" = 'UCL2526' 
            AND ("homeTeam" ILIKE '%Benfica%' OR "awayTeam" ILIKE '%Benfica%' OR "homeTeam" ILIKE '%Monaco%')
            LIMIT 5
        `);

        console.log(JSON.stringify(matches, null, 2));
        await AppDataSource.destroy();
    } catch (e) {
        console.error(e);
    }
}

verify();
