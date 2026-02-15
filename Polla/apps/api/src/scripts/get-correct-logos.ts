import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY || '75bca3686c6383db73cd2324f42eb0b3';
const BASE_URL = 'https://v3.football.api-sports.io';

async function getCorrectLogos() {
  try {
    console.log('🔍 Fetching fixture details from API-SPORTS...\n');

    // Get the specific fixture by ID
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        id: 1505992, // Cali vs Nacional fixture ID
      },
    });

    const fixture = response.data.response[0];

    if (!fixture) {
      console.log('❌ Fixture not found');
      process.exit(1);
    }

    console.log('✅ Fixture found!\n');
    console.log('🏠 HOME TEAM:');
    console.log(`   Name: ${fixture.teams.home.name}`);
    console.log(`   Logo: ${fixture.teams.home.logo}`);
    console.log(`   ID: ${fixture.teams.home.id}\n`);

    console.log('✈️  AWAY TEAM:');
    console.log(`   Name: ${fixture.teams.away.name}`);
    console.log(`   Logo: ${fixture.teams.away.logo}`);
    console.log(`   ID: ${fixture.teams.away.id}\n`);

    console.log('📋 SQL UPDATE:');
    console.log(`UPDATE matches SET`);
    console.log(`  "homeFlag" = '${fixture.teams.home.logo}',`);
    console.log(`  "awayFlag" = '${fixture.teams.away.logo}'`);
    console.log(`WHERE "externalId" = 1505992;`);

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

getCorrectLogos();
