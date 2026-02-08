import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
// Using native fetch (Node 18+)

dotenv.config();

dotenv.config();


const TEAMS_TO_UPDATE = [
    // Pot 1
    "Real Madrid", "Manchester City", "Bayern Munich", "Paris Saint Germain",
    "Liverpool", "Inter Milan", "Dortmund", "Leipzig", "Barcelona",
    // Pot 2
    "Bayer Leverkusen", "Atletico Madrid", "Atalanta", "Juventus",
    "Benfica", "Arsenal", "Club Brugge", "Shakhtar Donetsk", "AC Milan",
    // Pot 3
    "Feyenoord", "Sporting CP", "PSV", "Dinamo Zagreb",
    "Salzburg", "Lille", "Crvena Zvezda", "Young Boys", "Celtic",
    // Pot 4
    "Slovan Bratislava", "Monaco", "Sparta Prague", "Aston Villa",
    "Bologna", "Girona", "Stuttgart", "Sturm Graz", "Brest",
    // Extras
    "Galatasaray", "Bodø/Glimt", "Newcastle", "Olympiacos", "Qarabağ", "Fenerbahce"
];

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
});

async function fetchLogo(teamName: string): Promise<string | null> {
    try {
        const url = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
        const res = await fetch(url);
        const data = await res.json() as any;
        
        if (data && data.teams && data.teams.length > 0) {
            // Find best match or take first
            const team = data.teams[0];
            return team.strBadge || team.strLogo || null;
        }
        return null;
    } catch (error) {
        console.error(`Error fetching ${teamName}:`, error.message);
        return null;
    }
}

async function updateLogos() {
    await AppDataSource.initialize();
    console.log('🔌 Connected to DB');
    const queryRunner = AppDataSource.createQueryRunner();

    let updatedCount = 0;
    
    for (const teamName of TEAMS_TO_UPDATE) {
        process.stdout.write(`🔍 Updating ${teamName}... `);
        const logoUrl = await fetchLogo(teamName);
        
        if (logoUrl) {
            // Update Home
            await queryRunner.query(
                `UPDATE matches SET "homeFlag" = $1 WHERE "homeTeam" ILIKE $2 AND "tournamentId" IN ('WC2026', 'UCL2526')`, // ILIKE for case insensitive
                [logoUrl, `%${teamName}%`]
            );
            
            // Update Away
            await queryRunner.query(
                `UPDATE matches SET "awayFlag" = $1 WHERE "awayTeam" ILIKE $2 AND "tournamentId" IN ('WC2026', 'UCL2526')`,
                [logoUrl, `%${teamName}%`]
            );
            
            console.log(`✅ OK (${logoUrl})`);
            updatedCount++;
        } else {
            console.log(`❌ Not Found in API`);
        }
        
        // Small delay to be nice to API
        await new Promise(r => setTimeout(r, 200));
    }

    console.log(`✨ Finished. Processed ${updatedCount} teams.`);
    await AppDataSource.destroy();
}

updateLogos().catch(e => {
    console.error("FATAL ERROR:", e);
    process.exit(1);
});
