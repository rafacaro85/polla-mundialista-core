import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function diagnose() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123',
    database: process.env.DB_DATABASE || 'polla_mundialista',
    entities: ['src/database/entities/*.entity.ts'], // Ajustar path si es necesario, o usar raw query
    ssl: false,
  });

  try {
    await dataSource.initialize();
    console.log('DB Conectada.');

    const matches = await dataSource.query(`
            SELECT id, "date", "homeTeam", "awayTeam", "homeScore", "awayScore", status, "group", phase 
            FROM matches 
            WHERE "group" = 'K'
        `);

    console.log('--- Partidos del Grupo K ---');
    matches.forEach((m: any) => {
      console.log(
        `${m.date.toISOString().split('T')[0]} | ${m.homeTeam} (${m.homeScore}) vs (${m.awayScore}) ${m.awayTeam} | ${m.status}`,
      );
    });

    // Calcular tabla manual
    const stats: any = {};

    matches.forEach((m: any) => {
      if (m.status !== 'FINISHED') {
        console.log(
          `⚠️ Partido ${m.homeTeam} vs ${m.awayTeam} NO está FINISHED: ${m.status}`,
        );
        return;
      }

      [m.homeTeam, m.awayTeam].forEach((t) => {
        if (!stats[t]) stats[t] = { pts: 0, pj: 0, gf: 0, gc: 0 };
      });

      stats[m.homeTeam].pj++;
      stats[m.awayTeam].pj++;
      stats[m.homeTeam].gf += m.homeScore;
      stats[m.homeTeam].gc += m.awayScore;
      stats[m.awayTeam].gf += m.awayScore;
      stats[m.awayTeam].gc += m.homeScore;

      if (m.homeScore > m.awayScore) stats[m.homeTeam].pts += 3;
      else if (m.homeScore < m.awayScore) stats[m.awayTeam].pts += 3;
      else {
        stats[m.homeTeam].pts += 1;
        stats[m.awayTeam].pts += 1;
      }
    });

    console.log('--- Tabla Calculada Manualmente ---');
    console.table(stats);
  } catch (e) {
    console.error(e);
  } finally {
    await dataSource.destroy();
  }
}

diagnose();
