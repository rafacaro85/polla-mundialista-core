
import { AppDataSource } from './src/data-source';

async function run() {
    console.log('🚀 Starting Partial Migration Run...');
    try {
        await AppDataSource.initialize();
        console.log('✅ DataSource initialized');
        
        console.log('Checking if status column exists...');
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        
        try {
            // Check if enum exists
            const hasEnum = await queryRunner.query(
                `SELECT 1 FROM pg_type WHERE typname = 'league_participants_status_enum'`
            );
            
            if (hasEnum.length === 0) {
                console.log('creating enum...');
                await queryRunner.query(`CREATE TYPE "public"."league_participants_status_enum" AS ENUM('PENDING', 'ACTIVE', 'REJECTED')`);
            } else {
                console.log('enum already exists.');
            }

            // Check if column exists
            const hasColumn = await queryRunner.query(
                `SELECT column_name FROM information_schema.columns WHERE table_name='league_participants' AND column_name='status'`
            );
            
            if (hasColumn.length === 0) {
                 console.log('adding status column...');
                 await queryRunner.query(`ALTER TABLE "league_participants" ADD "status" "public"."league_participants_status_enum" NOT NULL DEFAULT 'ACTIVE'`);
                 console.log('✅ Column added successfully.');
            } else {
                 console.log('✅ Column status already exists.');
            }
        } catch (err) {
            console.error('SQL Error:', err);
        } finally {
            await queryRunner.release();
        }
        
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error running migrations:', error);
        process.exit(1);
    }
}

run();
