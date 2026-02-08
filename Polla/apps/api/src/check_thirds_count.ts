import { DataSource } from 'typeorm';
import { StandingsService } from './standings/standings.service';
import { Match } from './database/entities/match.entity';
import * as dotenv from 'dotenv';
dotenv.config();

async function checkThirds() {
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
    const repo = dataSource.getRepository(Match);
    // Simulamos StandingsService de forma simplificada o usamos raw query

    // Obtener todos los grupos con partidos finished
    const groups = await repo.query(
      `SELECT DISTINCT "group" FROM matches WHERE phase='GROUP'`,
    );

    console.log(`Grupos encontrados: ${groups.length}`);

    // Obtener tabla de terceros manual
    const allMatches = await repo.find({
      where: { phase: 'GROUP', status: 'FINISHED' },
    });

    // Calcular stats rapidito
    const teams: any = {};
    allMatches.forEach((m) => {
      // ... lógica de puntos ...
      if (!teams[m.homeTeam])
        teams[m.homeTeam] = { pts: 0, gf: 0, gd: 0, group: m.group };
      if (!teams[m.awayTeam])
        teams[m.awayTeam] = { pts: 0, gf: 0, gd: 0, group: m.group };

      // calculo simple puntos
      const hScore = m.homeScore || 0;
      const aScore = m.awayScore || 0;
      let hPts = 0,
        aPts = 0;
      if (hScore > aScore) hPts = 3;
      else if (aScore > hScore) aPts = 3;
      else {
        hPts = 1;
        aPts = 1;
      }

      teams[m.homeTeam].pts += hPts;
      teams[m.awayTeam].pts += aPts;
    });

    // Agrupar por grupo y sacar el 3ro
    const groupStandings: any = {};
    Object.keys(teams).forEach((t) => {
      const grp = teams[t].group;
      if (!groupStandings[grp]) groupStandings[grp] = [];
      groupStandings[grp].push({ team: t, ...teams[t] });
    });

    const thirds: any[] = [];
    Object.keys(groupStandings).forEach((g) => {
      const sorted = groupStandings[g].sort((a: any, b: any) => b.pts - a.pts); // simple sort
      if (sorted.length >= 3) {
        thirds.push(sorted[2]); // El tercero
      }
    });

    console.log(`Terceros encontrados: ${thirds.length}`);
    thirds.forEach((t, i) =>
      console.log(`${i + 1}. ${t.team} (${t.pts} pts) - Grupo ${t.group}`),
    );
  } catch (e) {
    console.error(e);
  } finally {
    await dataSource.destroy();
  }
}
checkThirds();
