import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findTomorrowsUCLMatches() {
  try {
    console.log(
      '🔍 Searching for REAL Champions League matches on Feb 17-18, 2026...\n',
    );

    // Query UCL league (ID: 2) for this season
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        league: 2, // UEFA Champions League
        season: 2025, // 2025-2026 season
        from: '2026-02-17',
        to: '2026-02-18',
      },
    });

    const fixtures = response.data.response;
    console.log(`📊 Total UCL fixtures Feb 17-18: ${fixtures.length}\n`);

    if (fixtures.length === 0) {
      console.log('❌ No UCL matches found for Feb 17-18.');
      console.log('\n🔄 Trying alternative: Query by date only...\n');

      // Fallback: just query by date
      const fallbackResponse = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          date: '2026-02-17',
        },
      });

      const allFixtures = fallbackResponse.data.response;
      console.log(`📊 Total fixtures on Feb 17: ${allFixtures.length}\n`);

      if (allFixtures.length > 0) {
        console.log('🎯 Showing first 10 matches for Feb 17:\n');
        allFixtures.slice(0, 10).forEach((fixture: any, index: number) => {
          const matchDate = new Date(fixture.fixture.date);
          const colombiaTime = matchDate.toLocaleString('es-CO', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            minute: '2-digit',
          });

          console.log(`${index + 1}. [ID: ${fixture.fixture.id}]`);
          console.log(
            `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
          );
          console.log(
            `   League: ${fixture.league.name} (${fixture.league.country})`,
          );
          console.log(`   Time: ${colombiaTime} (Colombia)`);
          console.log(`   Venue: ${fixture.fixture.venue.name || 'TBD'}\n`);
        });
      }

      process.exit(0);
    }

    console.log('⭐ REAL Champions League Matches:\n');

    fixtures.forEach((fixture: any, index: number) => {
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
      console.log(`   Round: ${fixture.league.round}`);
      console.log(`   Time: ${colombiaTime} (Colombia)`);
      console.log(`   Venue: ${fixture.fixture.venue.name || 'TBD'}`);
      console.log(`   Status: ${fixture.fixture.status.long}\n`);
    });

    if (fixtures.length > 0) {
      console.log('\n🎯 RECOMMENDED FOR TESTING:');
      const best = fixtures[0];
      const bestDate = new Date(best.fixture.date);
      const bestTime = bestDate.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      console.log(`\n   Fixture ID: ${best.fixture.id}`);
      console.log(
        `   Match: ${best.teams.home.name} vs ${best.teams.away.name}`,
      );
      console.log(`   Time: ${bestTime} (Colombia)`);
      console.log(`   Venue: ${best.fixture.venue.name}`);
      console.log(`\n   ✅ This is a REAL Champions League match!`);
      console.log(`   Use this ID to test the sync system! 🚀`);
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

findTomorrowsUCLMatches();
