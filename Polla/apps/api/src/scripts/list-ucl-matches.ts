import { Client } from 'pg';

async function listMatches() {
    const DB_URL = process.env.DATABASE_URL || `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;
    const client = new Client({ connectionString: DB_URL });
    await client.connect();
    
    console.log('📋 Listing matches for UCL2526 in DB:');
    const res = await client.query('SELECT "homeTeam", "awayTeam", "externalId" FROM matches WHERE "tournamentId" = \'UCL2526\'');
    console.table(res.rows);
    
    await client.end();
}

listMatches();
