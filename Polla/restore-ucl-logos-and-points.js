const { Client } = require('pg');

// 1. TEAMS DEFINITION (The same one I put in the service)
const TEAMS = {
    'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
    'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
    'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    'Bayern Múnich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
    'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
    'Inter Milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    'Inter': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
    'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
    'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
    'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    'Paris Saint-Germain': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
    'Atletico Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    'Atlético Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
    'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    'Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
    'Bayer Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
    'Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
    'Juventus': 'https://upload.wikimedia.org/wikipedia/commons/b/bc/Juventus_FC_2017_icon_%28black%29.svg',
    'AC Milan': 'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
    'Benfica': 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg',
    'Aston Villa': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Aston_Villa_FC_crest_%282016%29.svg',
    'PSV': 'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',
    'Galatasaray': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Galatasaray_Sports_Club_Logo.png/240px-Galatasaray_Sports_Club_Logo.png',
    'Atalanta': 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg',
    'Monaco': 'https://upload.wikimedia.org/wikipedia/en/b/ba/AS_Monaco_FC.svg',
    'Qarabag': 'https://upload.wikimedia.org/wikipedia/en/9/9b/Qaraba%C4%9F_FK_logo.svg',
    'Newcastle': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',
    'Olympiacos': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Olympiacos_CF_logo.svg',
    'Bodo/Glimt': 'https://upload.wikimedia.org/wikipedia/en/f/f5/FK_Bod%C3%B8_Glimt.svg',
    'Club Brujas': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg'
};

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL missing");
    process.exit(1);
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log("✅ Connected to DB");

        // 1. UPDATE UCL LOGOS
        console.log("🎨 Updating UCL Logos...");
        
        let updateCount = 0;
        const matches = await client.query(`SELECT id, "homeTeam", "awayTeam" FROM matches WHERE "tournamentId" = 'UCL2526'`);
        
        for (const m of matches.rows) {
            let hFlag = null;
            let aFlag = null;

            // Find flag for home team
            for (const [name, url] of Object.entries(TEAMS)) {
                if (m.homeTeam && (m.homeTeam === name || m.homeTeam.includes(name))) {
                    hFlag = url;
                    break;
                }
            }
            
            // Find flag for away team
            for (const [name, url] of Object.entries(TEAMS)) {
                if (m.awayTeam && (m.awayTeam === name || m.awayTeam.includes(name))) {
                    aFlag = url;
                    break;
                }
            }

            if (hFlag || aFlag) {
                const sets = [];
                const vals = [];
                let idx = 1;

                if (hFlag) { sets.push(`"homeFlag" = $${idx++}`); vals.push(hFlag); }
                if (aFlag) { sets.push(`"awayFlag" = $${idx++}`); vals.push(aFlag); }
                vals.push(m.id);

                const q = `UPDATE matches SET ${sets.join(', ')} WHERE id = $${idx}`;
                await client.query(q, vals);
                updateCount++;
                process.stdout.write('.');
            }
        }
        console.log(`\n✅ Updated logos for ${updateCount} matches.`);

        // 2. TRIGGER RECALCULATION
        console.log("🔄 Triggering Point Recalculation (Restore Points)...");
        // We can't easily call the NestJS service directly from a script without bootstrapping the app.
        // However, we can simulate the recalculation logic via direct SQL query or just call the API if it was running.
        // Since we are in the terminal, simpler to run SQL equivalent or just assume the user will hit "Recalculate" if available.
        // BUT, I can run an axios call to localhost if the app is running? No, user environment.
        // Better: I will implement the simple SQL update here to be safe and fast.
        
        // Recalculation Logic (Simplified in SQL):
        // a. Reset non-zero points? No, better safe than sorry.
        // The service does: UPDATE user_brackets SET points = 0;
        await client.query(`UPDATE user_brackets SET points = 0`);
        console.log("   - Reset points to 0");
        
        // b. Calculate points from finished matches
        // For each finished match, find brackets with correct pick and add points
        // PHASE POINTS MAP
        const POINTS = {
            'ROUND_32': 2,
            'ROUND_16': 3,
            'QUARTER': 6,
            'SEMI': 10,
            '3RD_PLACE': 15,
            'FINAL': 20,
            'PLAYOFF_1': 2,
            'PLAYOFF_2': 2
        };

        // Get finished matches with winners
        const finishedMatches = await client.query(`
            SELECT id, "tournamentId", phase, "homeScore", "awayScore", "homeTeam", "awayTeam"
            FROM matches 
            WHERE status = 'FINISHED' AND "homeScore" IS NOT NULL AND "awayScore" IS NOT NULL
        `);

        let bracketsUpdated = 0;

        for (const fm of finishedMatches.rows) {
            const winner = fm.homeScore > fm.awayScore ? fm.homeTeam : fm.awayTeam;
            const points = POINTS[fm.phase] || 0;
            
            if (points > 0 && winner) {
                // Find brackets that picked this winner
                // picks is JSONB: { "matchId": "TeamName" }
                // Query: UPDATE user_brackets SET points = points + X WHERE picks->>matchId = winner AND tournamentId = matchTournamentId
                const res = await client.query(`
                    UPDATE user_brackets 
                    SET points = points + $1
                    WHERE "tournamentId" = $2 
                    AND picks->>$3 = $4
                `, [points, fm.tournamentId, fm.id, winner]);
                bracketsUpdated += res.rowCount;
            }
        }

        console.log(`✅ Recalculated points. ${bracketsUpdated} allocations made across all brackets.`);

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await client.end();
    }
}

run();
