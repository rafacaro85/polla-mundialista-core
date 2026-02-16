import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findTodaysRealMatches() {
  try {
    console.log('🔍 Buscando partidos de HOY (fecha real del mundo)...\n');

    // Use actual real-world date (Feb 16, 2025 if that's today)
    const possibleDates = [
      '2025-02-16', // Sunday Feb 16, 2025
      '2025-02-15', // Saturday
      '2025-02-17', // Monday
    ];

    for (const dateStr of possibleDates) {
      console.log(`📅 Probando: ${dateStr}...\n`);

      const response = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          date: dateStr,
        },
      });

      const allFixtures = response.data.response;
      console.log(`   Total partidos: ${allFixtures.length}\n`);

      if (allFixtures.length > 0) {
        // Look for Girona vs Barcelona
        const girona = allFixtures.find((f: any) =>
          (f.teams.home.name.toLowerCase().includes('girona') && f.teams.away.name.toLowerCase().includes('barça')) ||
          (f.teams.home.name.toLowerCase().includes('girona') && f.teams.away.name.toLowerCase().includes('barcelona')) ||
          (f.teams.away.name.toLowerCase().includes('girona') && f.teams.home.name.toLowerCase().includes('barça')) ||
          (f.teams.away.name.toLowerCase().includes('girona') && f.teams.home.name.toLowerCase().includes('barcelona'))
        );

        // Look for Cagliari vs Lecce
        const cagliari = allFixtures.find((f: any) =>
          (f.teams.home.name.toLowerCase().includes('cagliari') && f.teams.away.name.toLowerCase().includes('lecce')) ||
          (f.teams.away.name.toLowerCase().includes('cagliari') && f.teams.home.name.toLowerCase().includes('lecce'))
        );

        if (girona || cagliari) {
          console.log(`✅ ¡PARTIDOS ENCONTRADOS en ${dateStr}!\n`);

          const foundMatches = [girona, cagliari].filter(Boolean);

          foundMatches.forEach((fixture: any) => {
            const matchDate = new Date(fixture.fixture.date);
            const colombiaTime = matchDate.toLocaleString('es-CO', {
              timeZone: 'America/Bogota',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            });

            console.log(`⚽ [ID: ${fixture.fixture.id}]`);
            console.log(`   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
            console.log(`   Liga: ${fixture.league.name}`);
            console.log(`   Hora: ${colombiaTime} (Colombia)`);
            console.log(`   Estadio: ${fixture.fixture.venue.name || 'TBD'}`);
            console.log(`   Estado: ${fixture.fixture.status.long}`);
            console.log(`   Logo Local: ${fixture.teams.home.logo}`);
            console.log(`   Logo Visitante: ${fixture.teams.away.logo}\n`);
          });

          // Output JSON
          console.log('\n📋 JSON PARA USAR:\n');
          console.log(JSON.stringify(foundMatches.map((f: any) => ({
            id: f.fixture.id,
            homeTeam: f.teams.home.name,
            awayTeam: f.teams.away.name,
            date: f.fixture.date,
            venue: f.fixture.venue.name,
            homeLogo: f.teams.home.logo,
            awayLogo: f.teams.away.logo,
            league: f.league.name,
            status: f.fixture.status.short,
          })), null, 2));

          process.exit(0);
        }

        // Show first 10 matches for reference
        console.log(`   Primeros 10 partidos del día:\n`);
        allFixtures.slice(0, 10).forEach((f: any, i: number) => {
          console.log(`   ${i + 1}. ${f.teams.home.name} vs ${f.teams.away.name} (${f.league.name})`);
        });
        console.log('');
      }
    }

    console.log('\n❌ No se encontraron Girona vs Barcelona ni Cagliari vs Lecce.');
    console.log('💡 Verifica que estos partidos realmente estén programados para hoy.');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

findTodaysRealMatches();
