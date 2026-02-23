import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findRealTimeMatches() {
  try {
    console.log(
      '🔍 Searching for matches happening RIGHT NOW (real date)...\n',
    );

    // Get today's REAL date
    const realToday = new Date();
    const realTodayStr = realToday.toISOString().split('T')[0];

    console.log(`📅 Real date: ${realTodayStr}\n`);

    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: realTodayStr,
      },
    });

    const allFixtures = response.data.response;
    console.log(`📊 Total fixtures today (real): ${allFixtures.length}\n`);

    if (allFixtures.length === 0) {
      console.log('❌ No matches found for today (real date).');
      process.exit(0);
    }

    // Filter for matches happening soon or live
    const now = new Date();
    const goodMatches = allFixtures.filter((fixture: any) => {
      const matchDate = new Date(fixture.fixture.date);
      const hoursUntil =
        (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      // Live matches or starting in next 4 hours
      return (
        fixture.fixture.status.short !== 'FT' &&
        (fixture.fixture.status.short !== 'NS' || hoursUntil <= 4)
      );
    });

    console.log(`✅ Found ${goodMatches.length} suitable match(es):\n`);

    goodMatches.slice(0, 5).forEach((fixture: any, index: number) => {
      const matchDate = new Date(fixture.fixture.date);
      const localTime = matchDate.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      const hoursUntil =
        (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

      console.log(
        `${index + 1}. ${fixture.fixture.status.short === 'LIVE' ? '🔴 LIVE' : '⏰'} [ID: ${fixture.fixture.id}]`,
      );
      console.log(
        `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
      );
      console.log(
        `   League: ${fixture.league.name} (${fixture.league.country})`,
      );
      console.log(`   Time: ${localTime} (Colombia)`);
      console.log(`   Status: ${fixture.fixture.status.long}`);
      if (fixture.fixture.status.short !== 'NS') {
        console.log(`   Score: ${fixture.goals.home} - ${fixture.goals.away}`);
      } else {
        console.log(`   Starts in: ${hoursUntil.toFixed(1)}h`);
      }
      console.log(`   Venue: ${fixture.fixture.venue.name || 'TBD'}\n`);
    });

    // Output JSON for script consumption
    console.log('\n📋 JSON OUTPUT (first 3 matches):');
    const topMatches = goodMatches.slice(0, 3);
    console.log(
      JSON.stringify(
        topMatches.map((f: any) => ({
          id: f.fixture.id,
          homeTeam: f.teams.home.name,
          awayTeam: f.teams.away.name,
          date: f.fixture.date,
          venue: f.fixture.venue.name,
          homeLogo: f.teams.home.logo,
          awayLogo: f.teams.away.logo,
          league: f.league.name,
          status: f.fixture.status.short,
        })),
        null,
        2,
      ),
    );

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

findRealTimeMatches();
