// @ts-nocheck
import axios from 'axios';
import { Client } from 'pg';

async function forceLink() {
  console.log(
    '📡 Fetching specifically for Monaco vs Paris Saint Germain on 2026-02-17...',
  );

  const API_KEY = process.env.APISPORTS_KEY;
  const DB_URL =
    process.env.DATABASE_URL ||
    `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

  if (!API_KEY) {
    console.error('❌ Missing APISPORTS_KEY');
    return;
  }

  try {
    const response = await axios.get(
      'https://v3.football.api-sports.io/fixtures',
      {
        params: { date: '2026-02-17' },
        headers: { 'x-apisports-key': API_KEY },
      },
    );

    const fixtures = response.data.response;
    // Search specifically for teams containing 'Monaco' and 'Paris'
    const match = fixtures.find(
      (f: any) =>
        (f.teams.home.name.toLowerCase().includes('monaco') ||
          f.teams.away.name.toLowerCase().includes('monaco')) &&
        (f.teams.home.name.toLowerCase().includes('paris') ||
          f.teams.away.name.toLowerCase().includes('paris')),
    );

    if (!match) {
      console.error('❌ Match NOT found in API even with relaxed search.');
      return;
    }

    const apiId = match.fixture.id;
    console.log(
      `🎯 Match Found in API: ${match.teams.home.name} vs ${match.teams.away.name} -> ID: ${apiId}`,
    );

    const client = new Client({ connectionString: DB_URL });
    await client.connect();

    // Find our DB match ID
    const dbRes = await client.query(
      'SELECT id, "homeTeam", "awayTeam" FROM matches WHERE ("homeTeam" ILIKE \'%Monaco%\' OR "awayTeam" ILIKE \'%Monaco%\') AND ("homeTeam" ILIKE \'%PSG%\' OR "awayTeam" ILIKE \'%PSG%\') AND "tournamentId" = \'UCL2526\'',
    );

    if (dbRes.rows.length === 0) {
      console.error('❌ Match NOT found in DB.');
      await client.end();
      return;
    }

    const dbMatch = dbRes.rows[0];
    console.log(
      `📝 Found DB Match: ${dbMatch.homeTeam} vs ${dbMatch.awayTeam} (ID: ${dbMatch.id})`,
    );

    const updateRes = await client.query(
      'UPDATE matches SET "externalId" = $1 WHERE id = $2',
      [apiId.toString(), dbMatch.id],
    );

    if (updateRes.rowCount > 0) {
      console.log(`✅ FIXED. Monaco vs PSG is now linked to ID ${apiId}.`);
    } else {
      console.error('❌ Failed to update DB.');
    }

    await client.end();
  } catch (err: any) {
    console.error('❌ Error:', err.message);
  }
}

forceLink();
