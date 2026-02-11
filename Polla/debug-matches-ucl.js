
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function checkMatches() {
  try {
    await client.connect();
    console.log('🔌 Connected to DB');

    // Fetch matches for UCL2526, specifically looking for the error ones
    // We filter by date to find the Feb 24 matches
    const res = await client.query(`
      SELECT id, "homeTeam", "awayTeam", date, status, "isManuallyLocked"
      FROM matches 
      WHERE "tournamentId" = 'UCL2526'
      AND date BETWEEN '2026-02-23' AND '2026-02-25'
      ORDER BY date ASC
    `);

    console.log(`\nFound ${res.rows.length} matches for FEB 24 (UCL2526):`);
    const now = new Date();
    console.log(`Current Server Time: ${now.toISOString()}`);

    if (res.rows.length === 0) {
        console.log('⚠️ NO MATCHES FOUND FOR FEB 24! Query date range might be wrong or matches missing.');
    }

    res.rows.forEach(m => {
        const matchDate = new Date(m.date);
        const lockBufferMs = 10 * 60 * 1000;
        const lockTime = new Date(matchDate.getTime() - lockBufferMs);
        const isTimeLocked = now >= lockTime;
        
        console.log(`[${m.id}] ${m.homeTeam} vs ${m.awayTeam}`);
        console.log(`   Date: ${matchDate.toISOString()}`);
        console.log(`   Status: ${m.status} | Manually Locked: ${m.isManuallyLocked}`);
        console.log(`   Lock Time: ${lockTime.toISOString()} | Is Time Locked? ${isTimeLocked}`);
        
        let blockedReason = null;
        if (m.status === 'FINISHED' || m.status === 'COMPLETED') blockedReason = 'FINISHED';
        else if (m.isManuallyLocked) blockedReason = 'MANUAL';
        else if (isTimeLocked) blockedReason = 'TIME';
        
        if (blockedReason) {
            console.log(`   ❌ BLOCKED BY: ${blockedReason}`);
        } else {
            console.log(`   ✅ OPEN FOR PREDICTIONS`);
        }
        console.log('---');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkMatches();
