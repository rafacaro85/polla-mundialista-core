import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

export const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL, // Auto-detect connection URL
    // Fallback to individual params if URL is not present (local dev)
    host: process.env.DATABASE_URL ? undefined : process.env.DB_HOST,
    port: process.env.DATABASE_URL ? undefined : parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DATABASE_URL ? undefined : process.env.DB_USERNAME,
    password: process.env.DATABASE_URL ? undefined : process.env.DB_PASSWORD,
    database: process.env.DATABASE_URL ? undefined : process.env.DB_DATABASE,
    
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined),
    synchronize: false,
    logging: true,
    entities: [join(__dirname, '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, 'database', 'migrations', '*.{ts,js}')],
    subscribers: [],
});
