import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findLiveOrUpcomingMatches() {
  try {
    console.log('🔍 Searching for LIVE or UPCOMING matches (next 6 hours)...\n');

    // First, check for live matches
    const liveResponse = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        live: 'all',
      },
    });

    const liveFixtures = liveResponse.data.response;
    console.log(`🔴 Currently LIVE: ${liveFixtures.length} match(es)\n`);

    if (liveFixtures.length > 0) {
      console.log('⚽ LIVE MATCHES RIGHT NOW:\n');
      liveFixtures.slice(0, 5).forEach((fixture: any, index: number) => {
        console.log(`${index + 1}. 🔴 [ID: ${fixture.fixture.id}] LIVE`);
        console.log(`   ${fixture.teams.home.name} ${fixture.goals.home} - ${fixture.goals.away} ${fixture.teams.away.name}`);
        console.log(`   League: ${fixture.league.name} (${fixture.league.country})`);
        console.log(`   Status: ${fixture.fixture.status.long} - ${fixture.fixture.status.elapsed}'`);
        console.log(`   Venue: ${fixture.fixture.venue.name || 'TBD'}\n`);
      });
    }

    // Get today's date
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    console.log(`📅 Checking all matches for today (${todayStr})...\n`);

    const todayResponse = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: todayStr,
      },
    });

    const allToday = todayResponse.data.response;
    console.log(`📊 Total matches today: ${allToday.length}\n`);

    // Filter for matches starting in next 1-6 hours
    const now = new Date();
    const upcoming = allToday.filter((fixture: any) => {
      const matchDate = new Date(fixture.fixture.date);
      const hoursUntil = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      return hoursUntil >= 1 && hoursUntil <= 6 && fixture.fixture.status.short === 'NS';
    });

    console.log(`⏰ Matches starting in 1-6 hours: ${upcoming.length}\n`);

    if (upcoming.length > 0) {
      console.log('🎯 UPCOMING MATCHES (Good for testing):\n');
      upcoming.slice(0, 10).forEach((fixture: any, index: number) => {
        const matchDate = new Date(fixture.fixture.date);
        const hoursUntil = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const localTime = matchDate.toLocaleString('es-CO', { 
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
        
        console.log(`${index + 1}. ⭐ [ID: ${fixture.fixture.id}]`);
        console.log(`   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`   League: ${fixture.league.name} (${fixture.league.country})`);
        console.log(`   Time: ${localTime} (Colombia) - Starts in ${hoursUntil.toFixed(1)}h`);
        console.log(`   Venue: ${fixture.fixture.venue.name || 'TBD'}\n`);
      });

      const best = upcoming[0];
      const bestDate = new Date(best.fixture.date);
      const bestTime = bestDate.toLocaleString('es-CO', { 
        timeZone: 'America/Bogota',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      
      console.log('\n🚀 RECOMMENDED FOR TESTING:');
      console.log(`\n   Fixture ID: ${best.fixture.id}`);
      console.log(`   Match: ${best.teams.home.name} vs ${best.teams.away.name}`);
      console.log(`   League: ${best.league.name}`);
      console.log(`   Time: ${bestTime} (Colombia)`);
      console.log(`\n   Use this ID in the injection script!`);
    } else if (liveFixtures.length > 0) {
      const best = liveFixtures[0];
      console.log('\n🔴 RECOMMENDED: Use a LIVE match for immediate testing:');
      console.log(`\n   Fixture ID: ${best.fixture.id}`);
      console.log(`   Match: ${best.teams.home.name} vs ${best.teams.away.name}`);
      console.log(`   League: ${best.league.name}`);
      console.log(`   Status: ${best.fixture.status.long} - ${best.fixture.status.elapsed}'`);
      console.log(`\n   This match is LIVE RIGHT NOW! Perfect for sync testing!`);
    } else {
      console.log('\n⚠️  No suitable matches found.');
      console.log('Try running this script later when matches are about to start.');
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

findLiveOrUpcomingMatches();
