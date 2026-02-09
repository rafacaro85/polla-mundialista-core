import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
  const config = {
    url: 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway'
  };

  const ds = new DataSource({
    type: 'postgres',
    url: config.url,
    synchronize: false,
    ssl: { rejectUnauthorized: false },
  });

  await ds.initialize();
  
  console.log("🚀 Backfilling Global Predictions from Local Leagues...");

  // Check columns again just in case
  // predictions: id, userId, matchId, homeScore, awayScore, isJoker, league_id, tournamentId, points
  // (ID is usually auto-generated UUID if default)

  // Use raw INSERT with SELECT
  const result = await ds.query(`
    INSERT INTO predictions ("userId", "matchId", "homeScore", "awayScore", "isJoker", "league_id", "tournamentId", "points")
    SELECT DISTINCT ON ("userId", "matchId") 
        "userId", 
        "matchId", 
        "homeScore", 
        "awayScore", 
        false, 
        NULL, 
        "tournamentId", 
        CASE 
            WHEN "isJoker" IS TRUE AND "points" > 0 THEN "points" / 2 
            ELSE "points" 
        END
    FROM predictions p1
    WHERE "league_id" IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM predictions p2 
        WHERE p2."userId" = p1."userId" AND p2."matchId" = p1."matchId" AND p2."league_id" IS NULL
    )
    ORDER BY "userId", "matchId", "points" DESC
  `);

  // Note: result might be empty array or command tag depending on driver.
  console.log("✅ Backfill Complete.");
  
  await ds.destroy();
}

run();
