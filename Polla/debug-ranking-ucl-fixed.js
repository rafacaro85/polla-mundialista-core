
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function debugRanking() {
  try {
    await client.connect();
    
    const tournamentId = 'UCL2526';
    console.log(`🔍 Debugging Ranking for: ${tournamentId}`);

    // EXACT QUERY FROM leagues.service.ts (FIXED)
    const rawQuery = `
      WITH 
      predictions_data AS (
        SELECT "userId", 
               SUM(CASE WHEN "isJoker" IS TRUE THEN points / 2 ELSE 0 END) as joker_points,
               SUM(CASE WHEN "isJoker" IS TRUE THEN points / 2 ELSE points END) as regular_points
        FROM predictions 
        WHERE "tournamentId" = $1 
        GROUP BY "userId"
      ),
      brackets_data AS (
        SELECT "userId", SUM(points) as points 
        FROM user_brackets 
        WHERE "tournamentId" = $1 
        GROUP BY "userId"
      ),
      bonus_data AS (
        SELECT uba."userId", SUM(uba."pointsEarned") as points
        FROM user_bonus_answers uba
        INNER JOIN bonus_questions bq ON bq.id = uba."questionId"
        WHERE bq."tournamentId" = $1 
        GROUP BY uba."userId"
      )
      SELECT 
        u.id, 
        u.nickname, 
        u."full_name" as "fullName", 
        u."avatar_url" as "avatarUrl",
        u.email,
        COALESCE(p.regular_points, 0) as "regularPoints",
        COALESCE(p.joker_points, 0) as "jokerPoints",
        COALESCE(b.points, 0) as "bracketPoints",
        COALESCE(bonus.points, 0) as "bonusPoints",
        (COALESCE(p.regular_points, 0) + COALESCE(p.joker_points, 0) + COALESCE(b.points, 0) + COALESCE(bonus.points, 0)) as "totalPoints"
      FROM users u
      LEFT JOIN predictions_data p ON p."userId" = u.id
      LEFT JOIN brackets_data b ON b."userId" = u.id
      LEFT JOIN bonus_data bonus ON bonus."userId" = u.id
      WHERE 
        (p."userId" IS NOT NULL OR b."userId" IS NOT NULL OR bonus."userId" IS NOT NULL)
        AND u.email NOT LIKE '%@demo.com' 
      ORDER BY "totalPoints" DESC, u."full_name" ASC
      LIMIT 10
    `;

    const results = await client.query(rawQuery, [tournamentId]);
    console.log(`\n🏆 Ranking Query Result: ${results.rows.length} rows found.`);
    
    if (results.rows.length > 0) {
        console.table(results.rows.map(r => ({
            id: r.id,
            email: r.email,
            points: r.totalPoints
        })));
    } else {
        console.log('⚠️ STILL EMPTY! Checking why...');
        
        // Check Specific League Data
        const specificLeagueID = 'a2d0c92d-df32-448e-b7aa-441b18721767';
        console.log(`\n--- Predictions for League: ${specificLeagueID} ---`);
        const leaguePreds = await client.query(`SELECT "tournamentId", "points", "userId" FROM predictions WHERE "league_id" = $1 LIMIT 5`, [specificLeagueID]);
        if (leaguePreds.rows.length === 0) {
            console.log('NO Predictions found for this league.');
        } else {
            console.table(leaguePreds.rows);
        }

        console.log(`\n--- League Entity Check ---`);
        const leagueEnt = await client.query(`SELECT id, name, "tournamentId" FROM leagues WHERE id = $1`, [specificLeagueID]);
        console.table(leagueEnt.rows);

        // Check for NULL tournamentIds
        console.log('\n--- Predictions with NULL tournamentId ---');
        const nullT = await client.query('SELECT count(*) FROM predictions WHERE "tournamentId" IS NULL');
        console.log(`Count: ${nullT.rows[0].count}`);

        // Check Matches for UCL2526
        console.log('\n--- Matches for UCL2526 ---');
        const uclMatches = await client.query(`SELECT id, "homeTeam", "awayTeam" FROM matches WHERE "tournamentId" = 'UCL2526' LIMIT 5`);
        if (uclMatches.rows.length === 0) {
            console.log('NO Matches found for UCL2526.');
        } else {
            console.table(uclMatches.rows);
            // Check predictions for the first match
            const mId = uclMatches.rows[0].id;
            console.log(`\nChecking predictions for Match ID: ${mId}`);
            const mPreds = await client.query(`SELECT id, "tournamentId", "userId" FROM predictions WHERE "matchId" = $1 LIMIT 5`, [mId]);
            console.table(mPreds.rows);
        }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

debugRanking();
