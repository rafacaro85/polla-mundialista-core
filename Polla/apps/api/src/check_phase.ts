import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkPhase() {
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
    const status = await dataSource.query(
      `SELECT * FROM knockout_phase_status WHERE phase = 'ROUND_32'`,
    );
    console.log('Phase Status:', status);

    const matches = await dataSource.query(
      `SELECT id, date, phase FROM matches WHERE phase = 'ROUND_32' LIMIT 5`,
    );
    console.log('Matches Sample:', matches);
  } catch (e) {
    console.error(e);
  } finally {
    await dataSource.destroy();
  }
}
checkPhase();
