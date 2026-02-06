const { Client } = require('pg');

const DB_URL = "postgresql://postgres:admin123@localhost:5432/polla_mundialista";

const MANUAL_LOGOS = {
    // API Failed ones
    "Paris": "https://crests.football-data.org/524.svg",
    "Paris Saint-Germain": "https://crests.football-data.org/524.svg",
    "PSG": "https://crests.football-data.org/524.svg",
    
    "Leipzig": "https://crests.football-data.org/721.svg",
    "RB Leipzig": "https://crests.football-data.org/721.svg",
    
    // Others that might have failed or have bad names
    "Crvena Zvezda": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg",
    "Red Star Belgrade": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg",
    
    "Sturm Graz": "https://upload.wikimedia.org/wikipedia/commons/0/06/SK_Sturm_Graz_Logo.svg",
    
    "Slovan Bratislava": "https://upload.wikimedia.org/wikipedia/commons/a/a2/ŠK_Slovan_Bratislava_logo.svg",
    
    "Salzburg": "https://upload.wikimedia.org/wikipedia/en/e/e1/Red_Bull_Salzburg_logo.svg", // Fallback to en/
    
    "Galatasaray": "https://upload.wikimedia.org/wikipedia/commons/f/f6/Galatasaray_Sports_Club_Logo.svg",
    
    "Sparta Prague": "https://upload.wikimedia.org/wikipedia/en/4/43/AC_Sparta_Praha_logo.svg"
};

async function run() {
    console.log("Connecting to DB...");
    const client = new Client({
        connectionString: DB_URL,
        // ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    
    try {
        const teams = Object.keys(MANUAL_LOGOS);
        for (const teamName of teams) {
            const logoUrl = MANUAL_LOGOS[teamName];
            console.log(`🔧 Manually Updating ${teamName} -> ${logoUrl}`);
            
            // Update Home
            await client.query(
                `UPDATE matches SET "homeFlag" = $1 WHERE "homeTeam" ILIKE $2`,
                [logoUrl, `%${teamName}%`]
            );
            
            // Update Away
            await client.query(
                `UPDATE matches SET "awayFlag" = $1 WHERE "awayTeam" ILIKE $2`,
                [logoUrl, `%${teamName}%`]
            );
        }
        console.log(`✨ Manual Fixes Applied.`);
    } catch (e) {
        console.error("ERROR:", e);
    } finally {
        await client.end();
    }
}

run();
