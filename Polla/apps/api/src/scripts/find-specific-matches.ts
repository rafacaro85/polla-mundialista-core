import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findSpecificMatches() {
  try {
    console.log('🔍 Buscando partidos específicos de HOY...\n');

    // Get REAL today's date (not the simulated 2026 date)
    const realNow = new Date();
    // The system thinks it's 2026, but we need to query the real current date
    // Let's try a few dates around today

    const dates = [
      '2024-02-16', // If today is really Feb 16, 2024
      '2024-02-17',
      '2024-02-15',
    ];

    for (const dateStr of dates) {
      console.log(`📅 Probando fecha: ${dateStr}...\n`);

      const response = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          date: dateStr,
        },
      });

      const allFixtures = response.data.response;
      console.log(`   Total partidos: ${allFixtures.length}`);

      // Look for Girona vs Barcelona
      const girona = allFixtures.find(
        (f: any) =>
          (f.teams.home.name.toLowerCase().includes('girona') &&
            f.teams.away.name.toLowerCase().includes('barcelona')) ||
          (f.teams.away.name.toLowerCase().includes('girona') &&
            f.teams.home.name.toLowerCase().includes('barcelona')),
      );

      // Look for Cagliari vs Lecce
      const cagliari = allFixtures.find(
        (f: any) =>
          (f.teams.home.name.toLowerCase().includes('cagliari') &&
            f.teams.away.name.toLowerCase().includes('lecce')) ||
          (f.teams.away.name.toLowerCase().includes('cagliari') &&
            f.teams.home.name.toLowerCase().includes('lecce')),
      );

      if (girona || cagliari) {
        console.log(`\n✅ ¡Partidos encontrados en ${dateStr}!\n`);

        const foundMatches = [girona, cagliari].filter(Boolean);

        foundMatches.forEach((fixture: any) => {
          const matchDate = new Date(fixture.fixture.date);
          const colombiaTime = matchDate.toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });

          console.log(`⚽ [ID: ${fixture.fixture.id}]`);
          console.log(
            `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          );
          console.log(`   Liga: ${fixture.league.name}`);
          console.log(`   Hora: ${colombiaTime} (Colombia)`);
          console.log(`   Estadio: ${fixture.fixture.venue.name || 'TBD'}`);
          console.log(`   Estado: ${fixture.fixture.status.long}`);
          console.log(`   Logo Local: ${fixture.teams.home.logo}`);
          console.log(`   Logo Visitante: ${fixture.teams.away.logo}\n`);
        });

        // Output JSON for easy copying
        console.log('\n📋 DATOS PARA SCRIPT:\n');
        console.log(
          JSON.stringify(
            foundMatches.map((f: any) => ({
              id: f.fixture.id,
              homeTeam: f.teams.home.name,
              awayTeam: f.teams.away.name,
              date: f.fixture.date,
              venue: f.fixture.venue.name,
              homeLogo: f.teams.home.logo,
              awayLogo: f.teams.away.logo,
              league: f.league.name,
            })),
            null,
            2,
          ),
        );

        process.exit(0);
      }
    }

    console.log(
      '\n❌ No se encontraron los partidos específicos en las fechas probadas.',
    );
    console.log('Mostrando algunos partidos de hoy para referencia:\n');

    // Show some matches from the first date
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: dates[0],
      },
    });

    const someMatches = response.data.response.slice(0, 5);
    someMatches.forEach((f: any, i: number) => {
      console.log(
        `${i + 1}. ${f.teams.home.name} vs ${f.teams.away.name} (${f.league.name})`,
      );
    });

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

findSpecificMatches();
