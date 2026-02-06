import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Manual migration to rename isLocked to isManuallyLocked
 * Run this script in production to apply the schema change
 */

const AppDataSource = process.env.DATABASE_URL
    ? new DataSource({
        type: 'postgres',
        url: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
        synchronize: false,
    })
    : new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_DATABASE || 'polla_mundialista',
        synchronize: false,
    });

async function runMigration() {
    try {
        await AppDataSource.initialize();
        console.log('✅ Connected to database');

        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        // Check if isLocked column exists
        const hasIsLocked = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'matches' AND column_name = 'isLocked'
        `);

        if (hasIsLocked.length > 0) {
            console.log('🔄 Renaming column isLocked to isManuallyLocked in matches table...');
            await queryRunner.query(`
                ALTER TABLE matches 
                RENAME COLUMN "isLocked" TO "isManuallyLocked"
            `);
            console.log('✅ Column renamed in matches table');
        } else {
            console.log('⚠️ isLocked column not found, checking if isManuallyLocked exists...');
            const hasIsManuallyLocked = await queryRunner.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'matches' AND column_name = 'isManuallyLocked'
            `);

            if (hasIsManuallyLocked.length === 0) {
                console.log('➕ Adding isManuallyLocked column to matches table...');
                await queryRunner.query(`
                    ALTER TABLE matches 
                    ADD COLUMN "isManuallyLocked" BOOLEAN NOT NULL DEFAULT false
                `);
                console.log('✅ Column added to matches table');
            } else {
                console.log('✅ isManuallyLocked column already exists in matches table');
            }
        }

        // Add isManuallyLocked to knockout_phase_status if not exists
        const hasPhaseColumn = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'knockout_phase_status' AND column_name = 'is_manually_locked'
        `);

        if (hasPhaseColumn.length === 0) {
            console.log('➕ Adding is_manually_locked column to knockout_phase_status table...');
            await queryRunner.query(`
                ALTER TABLE knockout_phase_status 
                ADD COLUMN is_manually_locked BOOLEAN NOT NULL DEFAULT false
            `);
            console.log('✅ Column added to knockout_phase_status table');
        } else {
            console.log('✅ is_manually_locked column already exists in knockout_phase_status table');
        }

        await queryRunner.release();
        await AppDataSource.destroy();

        console.log('\n✅ Migration completed successfully!');
        console.log('🔄 Restart your Railway service to apply changes.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    runMigration();
}
