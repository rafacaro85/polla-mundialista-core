import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findMondayMatches() {
  try {
    console.log('🔍 Searching for matches TODAY (Monday, Feb 16, 2026)...\n');

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: todayStr,
      },
    });

    const allFixtures = response.data.response;
    console.log(`📊 Total fixtures today: ${allFixtures.length}\n`);

    if (allFixtures.length === 0) {
      console.log('❌ No matches found for today.');
      process.exit(0);
    }

    // Look for specific matches
    const girona = allFixtures.find(
      (f: any) =>
        (f.teams.home.name.includes('Girona') &&
          f.teams.away.name.includes('Barcelona')) ||
        (f.teams.away.name.includes('Girona') &&
          f.teams.home.name.includes('Barcelona')),
    );

    const cagliari = allFixtures.find(
      (f: any) =>
        (f.teams.home.name.includes('Cagliari') &&
          f.teams.away.name.includes('Lecce')) ||
        (f.teams.away.name.includes('Cagliari') &&
          f.teams.home.name.includes('Lecce')),
    );

    const targetMatches = [girona, cagliari].filter(Boolean);

    if (targetMatches.length === 0) {
      console.log(
        '⚠️  Target matches (Girona vs Barcelona, Cagliari vs Lecce) not found.',
      );
      console.log('\nShowing first 10 matches for today:\n');

      allFixtures.slice(0, 10).forEach((fixture: any, index: number) => {
        const matchDate = new Date(fixture.fixture.date);
        const colombiaTime = matchDate.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        console.log(`${index + 1}. [ID: ${fixture.fixture.id}]`);
        console.log(
          `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        );
        console.log(
          `   League: ${fixture.league.name} (${fixture.league.country})`,
        );
        console.log(`   Time: ${colombiaTime} (Colombia)`);
        console.log(`   Status: ${fixture.fixture.status.long}\n`);
      });
    } else {
      console.log(`✅ Found ${targetMatches.length} target match(es):\n`);

      targetMatches.forEach((fixture: any, index: number) => {
        const matchDate = new Date(fixture.fixture.date);
        const colombiaTime = matchDate.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });

        console.log(`${index + 1}. ⚽ [ID: ${fixture.fixture.id}]`);
        console.log(
          `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        );
        console.log(`   League: ${fixture.league.name}`);
        console.log(`   Time: ${colombiaTime} (Colombia)`);
        console.log(`   Venue: ${fixture.fixture.venue.name || 'TBD'}`);
        console.log(`   Status: ${fixture.fixture.status.long}`);
        console.log(`   Home Logo: ${fixture.teams.home.logo}`);
        console.log(`   Away Logo: ${fixture.teams.away.logo}\n`);
      });

      // Output JSON for script consumption
      console.log('\n📋 JSON OUTPUT (for script):');
      console.log(
        JSON.stringify(
          targetMatches.map((f: any) => ({
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

findMondayMatches();
