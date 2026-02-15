import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import axios from 'axios';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Inline minimal Match entity to avoid import issues
@Entity('matches')
class Match {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: 'WC2026' })
  tournamentId: string;

  @Column()
  homeTeam: string;

  @Column()
  awayTeam: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @Column({ nullable: true })
  externalId: number;
}

const AppDataSource = process.env.DATABASE_URL
  ? new DataSource({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [Match],
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    })
  : new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      database: process.env.DB_DATABASE || 'polla_mundialista',
      entities: [Match],
      synchronize: false,
    });

const API_KEY = process.env.APISPORTS_KEY || '75bca3686c6383db73cd2324f42eb0b3';
const BASE_URL = 'https://v3.football.api-sports.io';

// Helper: Normalize team names for fuzzy matching
function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[áàäâ]/g, 'a')
    .replace(/[éèëê]/g, 'e')
    .replace(/[íìïî]/g, 'i')
    .replace(/[óòöô]/g, 'o')
    .replace(/[úùüû]/g, 'u')
    .replace(/ñ/g, 'n');
}

async function mapUCLFixtures() {
  try {
    console.log('✅ Connected to API-SPORTS v3');
    
    await AppDataSource.initialize();
    console.log('✅ Connected to Database');

    const matchRepo = AppDataSource.getRepository(Match);

    // Fetch all UCL matches from our DB (UCL2526 tournament)
    const ourMatches = await matchRepo.find({
      where: { tournamentId: 'UCL2526' },
    });

    // SNIPER METHOD: Query by specific dates instead of season
    // Target: Feb 17-18, 2026 (UCL Round of 16 - Ida)
    console.log('🔄 Fetching UCL fixtures for Feb 17-18, 2026...');
    
    let apiFixtures: any[] = [];
    
    // Strategy 1: Try date range query with league filter
    try {
      console.log('📅 Trying: /fixtures?league=2&season=2025&from=2026-02-17&to=2026-02-18');
      const response1 = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          league: 2,
          season: 2025,
          from: '2026-02-17',
          to: '2026-02-18',
        },
      });
      
      apiFixtures = response1.data.response || [];
      console.log(`📊 Strategy 1 returned: ${apiFixtures.length} fixtures`);
      
      if (apiFixtures.length > 0) {
        console.log('📅 API Response Sample:', JSON.stringify(apiFixtures[0], null, 2));
      }
    } catch (error: any) {
      console.log('⚠️ Strategy 1 failed:', error.message);
    }
    
    // Strategy 2: If Strategy 1 fails, try single date query (Feb 17)
    if (apiFixtures.length === 0) {
      try {
        console.log('📅 Trying: /fixtures?date=2026-02-17 (then filter by league)');
        const response2 = await axios.get(`${BASE_URL}/fixtures`, {
          headers: {
            'x-apisports-key': API_KEY,
          },
          params: {
            date: '2026-02-17',
          },
        });
        
        const allFixtures = response2.data.response || [];
        console.log(`📊 Strategy 2 returned: ${allFixtures.length} total fixtures`);
        
        // Filter for Champions League (league id = 2)
        apiFixtures = allFixtures.filter((f: any) => f.league.id === 2);
        console.log(`🎯 Filtered to ${apiFixtures.length} UCL fixtures`);
        
        if (apiFixtures.length > 0) {
          console.log('📅 API Response Sample:', JSON.stringify(apiFixtures[0], null, 2));
        }
      } catch (error: any) {
        console.log('⚠️ Strategy 2 failed:', error.message);
      }
    }
    
    // Strategy 3: Try Feb 18 if still no results
    if (apiFixtures.length === 0) {
      try {
        console.log('📅 Trying: /fixtures?date=2026-02-18');
        const response3 = await axios.get(`${BASE_URL}/fixtures`, {
          headers: {
            'x-apisports-key': API_KEY,
          },
          params: {
            date: '2026-02-18',
          },
        });
        
        const allFixtures = response3.data.response || [];
        console.log(`📊 Strategy 3 returned: ${allFixtures.length} total fixtures`);
        
        apiFixtures = allFixtures.filter((f: any) => f.league.id === 2);
        console.log(`🎯 Filtered to ${apiFixtures.length} UCL fixtures`);
      } catch (error: any) {
        console.log('⚠️ Strategy 3 failed:', error.message);
      }
    }

    console.log(`\n📊 Total UCL fixtures found: ${apiFixtures.length}`);

    // Debug: Log all fixture details
    if (apiFixtures.length > 0) {
      console.log('\n🔍 All UCL fixtures found:');
      apiFixtures.forEach((f: any, idx: number) => {
        console.log(`   ${idx + 1}. ${f.teams.home.name} vs ${f.teams.away.name}`);
        console.log(`      ID: ${f.fixture.id}, Date: ${f.fixture.date}`);
      });
    }

    const relevantFixtures = apiFixtures; // All are relevant since we queried specific dates

    console.log(`🎯 Filtered to ${relevantFixtures.length} Round of 16 fixtures (Feb/Mar 2026)`);

    let mappedCount = 0;
    let unmappedCount = 0;

    // Map each API fixture to our DB matches
    for (const apiFixture of relevantFixtures) {
      const homeTeamAPI = normalizeTeamName(apiFixture.teams.home.name);
      const awayTeamAPI = normalizeTeamName(apiFixture.teams.away.name);
      const fixtureId = apiFixture.fixture.id;
      const fixtureDate = new Date(apiFixture.fixture.date);

      // Find matching record in our DB
      const match = ourMatches.find((m) => {
        const homeTeamDB = normalizeTeamName(m.homeTeam);
        const awayTeamDB = normalizeTeamName(m.awayTeam);
        const matchDate = new Date(m.date);

        // Match by team names and date proximity (within 24 hours)
        const teamMatch = homeTeamDB === homeTeamAPI && awayTeamDB === awayTeamAPI;
        const dateMatch = Math.abs(matchDate.getTime() - fixtureDate.getTime()) < 24 * 60 * 60 * 1000;

        return teamMatch && dateMatch;
      });

      if (match) {
        // Update externalId
        match.externalId = fixtureId;
        await matchRepo.save(match);
        
        console.log(
          `🔗 Linked: [${apiFixture.teams.home.name} vs ${apiFixture.teams.away.name}] -> API ID: ${fixtureId}`
        );
        mappedCount++;
      } else {
        console.log(
          `⚠️  No match found for: [${apiFixture.teams.home.name} vs ${apiFixture.teams.away.name}] (${fixtureDate.toISOString()})`
        );
        unmappedCount++;
      }
    }

    console.log('\n📊 Mapping Summary:');
    console.log(`   ✅ Successfully mapped: ${mappedCount}`);
    console.log(`   ⚠️  Unmapped: ${unmappedCount}`);
    console.log('\n🎉 Mapping complete!');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

mapUCLFixtures();
