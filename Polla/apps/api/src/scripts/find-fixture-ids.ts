import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findTodayMatches() {
  try {
    console.log('🔍 Buscando partidos de hoy (16 Feb 2025)...\n');

    // Try today's date in real world (2025-02-16)
    const dateStr = '2025-02-16';

    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: dateStr,
      },
    });

    const allFixtures = response.data.response;
    console.log(`📅 Total partidos en ${dateStr}: ${allFixtures.length}\n`);

    if (allFixtures.length === 0) {
      console.log('❌ No hay partidos para esa fecha en la API.');
      console.log('💡 Probando con la fecha actual del sistema...\n');

      // Try with system date
      const today = new Date();
      const systemDate = today.toISOString().split('T')[0];

      const response2 = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          date: systemDate,
        },
      });

      const systemFixtures = response2.data.response;
      console.log(
        `📅 Total partidos en ${systemDate}: ${systemFixtures.length}\n`,
      );

      if (systemFixtures.length > 0) {
        console.log('✅ Partidos encontrados en la fecha del sistema:\n');
        systemFixtures.slice(0, 10).forEach((f: any, i: number) => {
          const time = new Date(f.fixture.date).toLocaleTimeString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          });
          console.log(
            `${i + 1}. [ID: ${f.fixture.id}] ${f.teams.home.name} vs ${f.teams.away.name}`,
          );
          console.log(`   Liga: ${f.league.name} | Hora: ${time} COT`);
          console.log(`   Estado: ${f.fixture.status.long}\n`);
        });
      }

      process.exit(0);
    }

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

    const foundMatches = [girona, cagliari].filter(Boolean);

    if (foundMatches.length > 0) {
      console.log(`✅ ¡PARTIDOS ENCONTRADOS!\n`);

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

      console.log('\n📋 CONFIGURACIÓN PARA EL SCRIPT:\n');

      if (girona) {
        console.log(
          `MATCH_1_FIXTURE_ID = ${girona.fixture.id}; // ${girona.teams.home.name} vs ${girona.teams.away.name}`,
        );
      }

      if (cagliari) {
        console.log(
          `MATCH_2_FIXTURE_ID = ${cagliari.fixture.id}; // ${cagliari.teams.home.name} vs ${cagliari.teams.away.name}`,
        );
      }

      process.exit(0);
    } else {
      console.log(
        '❌ No se encontraron Girona vs Barcelona ni Cagliari vs Lecce.\n',
      );
      console.log('💡 Mostrando primeros 20 partidos del día:\n');

      allFixtures.slice(0, 20).forEach((f: any, i: number) => {
        const time = new Date(f.fixture.date).toLocaleTimeString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        console.log(
          `${i + 1}. [ID: ${f.fixture.id}] ${f.teams.home.name} vs ${f.teams.away.name}`,
        );
        console.log(`   Liga: ${f.league.name} | Hora: ${time} COT\n`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

findTodayMatches();
