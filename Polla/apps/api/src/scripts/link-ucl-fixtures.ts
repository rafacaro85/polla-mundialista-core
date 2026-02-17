import axios from 'axios';
import { Client } from 'pg';

async function linkFixtures() {
    console.log('📡 Fetching fixtures for 2026-02-17...');
    
    // Read from .env explicitly if needed, but run_command should have them
    const API_KEY = process.env.APISPORTS_KEY;
    const DB_URL = process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

    if (!API_KEY) {
        console.error('❌ Missing APISPORTS_KEY');
        return;
    }

    try {
        const response = await axios.get('https://v3.football.api-sports.io/fixtures', {
            params: { date: '2026-02-17' }, 
            headers: { 'x-apisports-key': API_KEY }
        });

        const fixtures = response.data.response;
        console.log(`✅ Found ${fixtures.length} fixtures in API.`);

        const targets = [
            { home: 'Galatasaray', away: 'Juventus' },
            { home: 'Dortmund', away: 'Atalanta' },
            { home: 'Monaco', away: 'PSG' },
            { home: 'Benfica', away: 'Real Madrid' }
        ];

        const updates = [];

        for (const target of targets) {
            const match = fixtures.find((f: any) => 
                (f.teams.home.name.toLowerCase().includes(target.home.toLowerCase()) || target.home.toLowerCase().includes(f.teams.home.name.toLowerCase())) &&
                (f.teams.away.name.toLowerCase().includes(target.away.toLowerCase()) || target.away.toLowerCase().includes(f.teams.away.name.toLowerCase()))
            );

            if (match) {
                console.log(`🎯 Match Found: ${match.teams.home.name} vs ${match.teams.away.name} -> ID: ${match.fixture.id}`);
                updates.push({ id: match.fixture.id, home: target.home, away: target.away });
            } else {
                console.warn(`⚠️  Match NOT Found in API: ${target.home} vs ${target.away}`);
            }
        }

        if (updates.length > 0) {
            const client = new Client({ connectionString: process.env.DATABASE_URL });
            await client.connect();
            
            for (const upd of updates) {
                // Use ILIKE to find the match in our DB
                const res = await client.query(
                    'UPDATE matches SET "externalId" = $1 WHERE "homeTeam" ILIKE $2 AND "awayTeam" ILIKE $3 AND "tournamentId" = \'UCL2526\'',
                    [upd.id.toString(), `%${upd.home}%`, `%${upd.away}%`]
                );
                console.log(`📝 Updated DB for ${upd.home} vs ${upd.away}: ${res.rowCount} row(s)`);
            }
            await client.end();
        }

    } catch (err: any) {
        console.error('❌ Error:', err.message);
    }
}

linkFixtures();
