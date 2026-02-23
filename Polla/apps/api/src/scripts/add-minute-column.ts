import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
    });

async function addMinuteColumn() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');

    // Check if column already exists
    const result = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'matches' 
      AND column_name = 'minute'
    `);

    if (result.length > 0) {
      console.log('⚠️  Column "minute" already exists. Skipping migration.');
      process.exit(0);
    }

    // Add the minute column
    await AppDataSource.query(`
      ALTER TABLE matches 
      ADD COLUMN minute INTEGER NULL
    `);

    console.log('✅ Successfully added "minute" column to matches table');
    console.log(
      '   This column will store elapsed match time during live games',
    );

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

addMinuteColumn();
