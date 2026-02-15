import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY || '75bca3686c6383db73cd2324f42eb0b3';
const BASE_URL = 'https://v3.football.api-sports.io';

async function findCaliNacionalFixture() {
  try {
    console.log('✅ Connected to API-SPORTS v3');
    console.log('🔍 Searching for Cali vs Nacional on 2026-02-15...\n');

    // Query fixtures for today's date
    const response = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: '2026-02-15',
      },
    });

    const allFixtures = response.data.response || [];
    console.log(`📊 Found ${allFixtures.length} total fixtures for Feb 15, 2026\n`);

    // Filter for matches containing "Cali" or "Nacional"
    const matches = allFixtures.filter((f: any) => {
      const homeName = f.teams.home.name.toLowerCase();
      const awayName = f.teams.away.name.toLowerCase();
      
      return (
        homeName.includes('cali') ||
        homeName.includes('nacional') ||
        awayName.includes('cali') ||
        awayName.includes('nacional')
      );
    });

    console.log(`🎯 Found ${matches.length} match(es) with Cali or Nacional:\n`);

    if (matches.length === 0) {
      console.log('❌ No matches found for Cali or Nacional on this date.');
      console.log('\n💡 Showing first 10 fixtures to help debug:');
      allFixtures.slice(0, 10).forEach((f: any, idx: number) => {
        console.log(`   ${idx + 1}. ${f.teams.home.name} vs ${f.teams.away.name} (League: ${f.league.name})`);
      });
    } else {
      matches.forEach((fixture: any, idx: number) => {
        console.log(`${idx + 1}. 🎯 FOUND MATCH:`);
        console.log(`   ${fixture.teams.home.name} vs ${fixture.teams.away.name}`);
        console.log(`   -> ID: ${fixture.fixture.id}`);
        console.log(`   League: ${fixture.league.name}`);
        console.log(`   Date: ${fixture.fixture.date}`);
        console.log(`   Status: ${fixture.fixture.status.long}\n`);
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

findCaliNacionalFixture();
