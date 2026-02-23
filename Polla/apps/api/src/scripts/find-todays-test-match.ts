import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findTodaysTestMatch() {
  try {
    console.log(
      '🔍 Searching for matches playing TODAY (Monday, Feb 16, 2026)...\n',
    );

    const today = '2026-02-16';

    // Query API for today's matches
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: today,
      },
    });

    const allFixtures = response.data.response;
    console.log(`📊 Total fixtures today: ${allFixtures.length}\n`);

    if (allFixtures.length === 0) {
      console.log('❌ No matches found for today.');
      process.exit(0);
    }

    // Filter for matches starting in next 2-8 hours (good testing window)
    const now = new Date();
    const nowColombia = new Date(
      now.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
    );

    const goodMatches = allFixtures.filter((fixture: any) => {
      const matchDate = new Date(fixture.fixture.date);
      const matchDateColombia = new Date(
        matchDate.toLocaleString('en-US', { timeZone: 'America/Bogota' }),
      );
      const hoursUntil =
        (matchDateColombia.getTime() - nowColombia.getTime()) /
        (1000 * 60 * 60);

      // Matches starting in 2-8 hours
      return hoursUntil >= 2 && hoursUntil <= 8;
    });

    console.log(
      `✅ Found ${goodMatches.length} match(es) starting in 2-8 hours:\n`,
    );

    if (goodMatches.length === 0) {
      console.log(
        "⚠️  No matches in ideal time window. Showing all today's matches:\n",
      );

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
        console.log(`   Status: ${fixture.fixture.status.long}\n`);
      });
    } else {
      goodMatches.forEach((fixture: any, index: number) => {
        const matchDate = new Date(fixture.fixture.date);
        const colombiaTime = matchDate.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
        });

        const hoursUntil =
          (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

        console.log(`${index + 1}. ⭐ [ID: ${fixture.fixture.id}]`);
        console.log(
          `   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`,
        );
        console.log(
          `   League: ${fixture.league.name} (${fixture.league.country})`,
        );
        console.log(`   Time: ${colombiaTime} (Colombia)`);
        console.log(`   Starts in: ${hoursUntil.toFixed(1)} hours`);
        console.log(`   Status: ${fixture.fixture.status.long}\n`);
      });

      console.log('\n🎯 RECOMMENDED FOR TESTING:');
      const best = goodMatches[0];
      const bestDate = new Date(best.fixture.date);
      const bestTime = bestDate.toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
      });

      console.log(`\n   Fixture ID: ${best.fixture.id}`);
      console.log(
        `   Match: ${best.teams.home.name} vs ${best.teams.away.name}`,
      );
      console.log(`   League: ${best.league.name}`);
      console.log(`   Time: ${bestTime} (Colombia)`);
      console.log(`\n   Use this ID in the injection script! 🚀`);
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

findTodaysTestMatch();
