
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config();

const LOG_FILE = 'debug-output.txt';
if (fs.existsSync(LOG_FILE)) fs.unlinkSync(LOG_FILE);

function log(msg: string) {
    console.log(msg);
    fs.appendFileSync(LOG_FILE, msg + '\n');
}

log("🚀 Starting RAW debug script...");

const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    // ssl: { rejectUnauthorized: false }, // DISABLED for local dev if server doesn't support it
});

async function run() {
  try {
    await ds.initialize();
    log("✅ Database connected!");
    
    // Check DB stats
    const userCount = await ds.query('SELECT COUNT(*) as c FROM users');
    log(`👥 Total Users in DB: ${userCount[0].c}`);
    
    const predCount = await ds.query('SELECT COUNT(*) as c FROM predictions');
    log(`🎲 Total Predictions in DB: ${predCount[0].c}`);

    // Fuzzy search user
    const users = await ds.query(`SELECT id, email, "full_name" as "fullName" FROM users WHERE email ILIKE '%racv%'`);
    log(`🔎 Users found matching 'racv': ${JSON.stringify(users, null, 2)}`);

    if (users.length === 0) {
        log("❌ No user found! Check .env connection.");
        await ds.destroy();
        return;
    }

    const email = users[0].email;
    log(`🔍 Querying for predictions of: ${email} (${users[0].id})...`);

    const rows = await ds.query(`
        SELECT u.email, m.id as match_id, m."homeTeam", m."awayTeam", 
               p."homeScore", p."awayScore", p.points, p."isJoker", p."league_id"
        FROM users u
        JOIN predictions p ON p."userId" = u.id
        JOIN matches m ON p."matchId" = m.id
        WHERE u.email = $1
    `, [email]);
    
    log(`📊 Found ${rows.length} predictions.`);

    // Group
    const matchesMap = new Map();
    rows.forEach(r => {
        if (!matchesMap.has(r.match_id)) matchesMap.set(r.match_id, []);
        matchesMap.get(r.match_id).push(r);
    });

    let discrepancies = false;
    let pointsMismatch = false;

    for (const [mid, preds] of matchesMap) {
        if (preds.length <= 1) continue;

        const first = preds[0];
        // Score Diff
        const diffScore = preds.some(p => p.homeScore !== first.homeScore || p.awayScore !== first.awayScore);
        if (diffScore) {
            discrepancies = true;
            log(`\n⚠️  SCORE DIFF: ${first.homeTeam} vs ${first.awayTeam}`);
             preds.forEach(p => {
                const ctx = p.league_id ? `League ${p.league_id}` : 'GLOBAL';
                log(`   ${ctx}: ${p.homeScore}-${p.awayScore} (Pts: ${p.points}, Joker: ${p.isJoker})`);
            });
        }

        // Points Diff
        if (!diffScore) {
             const diffPoints = preds.some(p => p.points !== first.points);
             if (diffPoints) {
                 pointsMismatch = true;
                 log(`\n⚠️  POINTS DIFF: ${first.homeTeam} vs ${first.awayTeam}`);
                 preds.forEach(p => {
                    const ctx = p.league_id ? `League ${p.league_id}` : 'GLOBAL';
                    log(`   ${ctx}: ${p.homeScore}-${p.awayScore} (Pts: ${p.points}, Joker: ${p.isJoker})`);
                });
             }
        }
    }

    if (!discrepancies) log("\n✅ No SCORE discrepancies found.");
    else log("\n❌ SCORE discrepancies found.");

    if (!pointsMismatch) log("✅ No POINTS discrepancies found (for same scores).");
    else log("❌ POINTS discrepancies found.");

    await ds.destroy();
  } catch (e) {
      console.error(e);
      fs.appendFileSync(LOG_FILE, `ERROR: ${e}\n`);
  }
}

run();
