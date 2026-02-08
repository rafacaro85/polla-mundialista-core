import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function lockFuturePhases() {
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

    // Bloquear todo lo que no sea GROUP o ROUND_32
    await dataSource.query(`
            UPDATE knockout_phase_status 
            SET is_unlocked = false 
            WHERE phase IN ('ROUND_16', 'QUARTER', 'SEMI', 'FINAL')
        `);

    console.log(
      '✅ Fases futuras bloqueadas (ROUND_16, QUARTER, SEMI, FINAL).',
    );

    const status = await dataSource.query(
      `SELECT phase, is_unlocked FROM knockout_phase_status`,
    );
    console.log('Current Status:', status);
  } catch (e) {
    console.error(e);
  } finally {
    await dataSource.destroy();
  }
}
lockFuturePhases();
