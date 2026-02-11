
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
    const now = new Date();
    // Fetch matches for UCL2526
    const res = await client.query(`
      SELECT id, "homeTeam", "awayTeam", date, status, "isManuallyLocked", "tournamentId"
      FROM matches 
      WHERE "tournamentId" = 'UCL2526'
      ORDER BY date ASC
    `);

    console.log(`Checking ${res.rows.length} matches for LOCKED status...`);
    
    let blockedCount = 0;
    res.rows.forEach(m => {
        const matchDate = new Date(m.date);
        const lockBufferMs = 10 * 60 * 1000;
        const lockTime = new Date(matchDate.getTime() - lockBufferMs);
        const isTimeLocked = now >= lockTime;
        
        let blockedReason = null;
        if (m.status === 'FINISHED' || m.status === 'COMPLETED') blockedReason = 'FINISHED';
        else if (m.isManuallyLocked) blockedReason = 'MANUAL';
        else if (isTimeLocked) blockedReason = 'TIME';
        
        if (blockedReason) {
            blockedCount++;
            console.log(`[${m.id}] ${m.homeTeam} vs ${m.awayTeam} | ${m.date.toISOString()} | ❌ BLOCKED BY: ${blockedReason}`);
        }
    });
    
    if (blockedCount === 0) {
        console.log('✅ All matches are OPEN. No TimeLockGuard issues found.');
    } else {
        console.log(`⚠️ Found ${blockedCount} blocked matches. If any of these are included in the BULK request, it will FAIL.`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

checkMatches();
