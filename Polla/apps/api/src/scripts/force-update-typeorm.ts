import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Match } from '../database/entities/match.entity';

dotenv.config();

console.log("🚀 Script started...");

const LOGO_MAP: Record<string, string> = {
    // Pot 1
    "Real Madrid": "https://crests.football-data.org/86.svg",
    "Manchester City": "https://crests.football-data.org/65.svg",
    "Bayern Munich": "https://crests.football-data.org/5.svg",
    "Bayern München": "https://crests.football-data.org/5.svg",
    "Paris Saint-Germain": "https://crests.football-data.org/524.svg",
    "PSG": "https://crests.football-data.org/524.svg",
    "Paris": "https://crests.football-data.org/524.svg",
    "Liverpool": "https://crests.football-data.org/64.svg",
    "Inter Milan": "https://crests.football-data.org/108.svg",
    "Inter": "https://crests.football-data.org/108.svg",
    "Dortmund": "https://crests.football-data.org/4.svg",
    "Borussia Dortmund": "https://crests.football-data.org/4.svg",
    "RB Leipzig": "https://crests.football-data.org/721.svg",
    "Leipzig": "https://crests.football-data.org/721.svg",
    "Barcelona": "https://crests.football-data.org/81.svg",
    "FC Barcelona": "https://crests.football-data.org/81.svg",

    // Pot 2
    "Bayer Leverkusen": "https://crests.football-data.org/3.svg",
    "Leverkusen": "https://crests.football-data.org/3.svg",
    "Atletico Madrid": "https://crests.football-data.org/78.svg",
    "Atlético de Madrid": "https://crests.football-data.org/78.svg",
    "Atalanta": "https://crests.football-data.org/102.svg",
    "Juventus": "https://crests.football-data.org/109.svg",
    "Benfica": "https://crests.football-data.org/1903.svg",
    "Arsenal": "https://crests.football-data.org/57.svg",
    "Club Brugge": "https://crests.football-data.org/312.svg", // Verified
    "Shakhtar Donetsk": "https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg", // Keep Wiki/Generic for now
    "AC Milan": "https://crests.football-data.org/98.svg",
    "Milan": "https://crests.football-data.org/98.svg",

    // Pot 3
    "Feyenoord": "https://crests.football-data.org/675.svg",
    "Sporting CP": "https://crests.football-data.org/498.svg",
    "Sporting Lisbon": "https://crests.football-data.org/498.svg",
    "PSV": "https://crests.football-data.org/674.svg",
    "Dinamo Zagreb": "https://upload.wikimedia.org/wikipedia/commons/2/23/NK_Dinamo_Zagreb.svg",
    "Salzburg": "https://crests.football-data.org/1877.svg",
    "Lille": "https://crests.football-data.org/521.svg",
    "Crvena Zvezda": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg",
    "Red Star Belgrade": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg",
    "Young Boys": "https://crests.football-data.org/1871.svg", // Verified
    "Celtic": "https://crests.football-data.org/732.svg",

    // Pot 4
    "Slovan Bratislava": "https://upload.wikimedia.org/wikipedia/commons/a/a2/ŠK_Slovan_Bratislava_logo.svg",
    "Monaco": "https://crests.football-data.org/548.svg",
    "AS Monaco": "https://crests.football-data.org/548.svg",
    "Sparta Prague": "https://crests.football-data.org/6200.svg", // Might be incorrect, fallback safe
    "Aston Villa": "https://crests.football-data.org/58.svg",
    "Bologna": "https://crests.football-data.org/103.svg",
    "Girona": "https://crests.football-data.org/298.svg",
    "Stuttgart": "https://crests.football-data.org/10.svg",
    "Sturm Graz": "https://crests.football-data.org/202.svg", // Verified
    "Brest": "https://crests.football-data.org/512.svg",
    "Stade Brestois": "https://crests.football-data.org/512.svg",

    // Extras
    "Galatasaray": "https://crests.football-data.org/610.svg",
    "Bodø/Glimt": "https://crests.football-data.org/444.svg", // Maybe
    "Newcastle": "https://crests.football-data.org/67.svg",
    "Olympiacos": "https://crests.football-data.org/654.svg",
    "Qarabağ": "https://crests.football-data.org/5123.svg" // Guess
};

const AppDataSource = new DataSource({
    type: 'postgres',
    url: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway",
    ssl: { rejectUnauthorized: false }, 
    synchronize: false,
    entities: []
});

async function run() {
    await AppDataSource.initialize();
    console.log('🔌 Connected to PROD DB -> Applying Local Assets');
    
    const queryRunner = AppDataSource.createQueryRunner();

    // Mapping of team name to local asset slug
    const ASSET_MAP: Record<string, string> = {
        // Pot 1
        "Real Madrid": "real-madrid",
        "Manchester City": "manchester-city",
        "Bayern Munich": "bayern-munich",
        "Bayern München": "bayern-munich",
        "Paris Saint-Germain": "paris-saint-germain",
        "PSG": "paris-saint-germain",
        "Paris": "paris-saint-germain",
        "Liverpool": "liverpool",
        "Inter Milan": "inter-milan",
        "Inter": "inter-milan",
        "Dortmund": "dortmund",
        "Borussia Dortmund": "dortmund",
        "RB Leipzig": "rb-leipzig",
        "Leipzig": "rb-leipzig",
        "Barcelona": "barcelona",
        "FC Barcelona": "barcelona",

        // Pot 2
        "Bayer Leverkusen": "bayer-leverkusen",
        "Leverkusen": "bayer-leverkusen",
        "Atletico Madrid": "atletico-madrid",
        "Atlético de Madrid": "atletico-madrid",
        "Atalanta": "atalanta",
        "Juventus": "juventus",
        "Benfica": "benfica",
        "Arsenal": "arsenal",
        "Club Brugge": "club-brugge",
        "Shakhtar Donetsk": "shakhtar-donetsk",
        "AC Milan": "ac-milan",
        "Milan": "ac-milan",

        // Pot 3
        "Feyenoord": "feyenoord",
        "Sporting CP": "sporting-cp",
        "Sporting Lisbon": "sporting-cp",
        "PSV": "psv",
        "Dinamo Zagreb": "dinamo-zagreb",
        "Salzburg": "salzburg",
        "Lille": "lille",
        "Crvena Zvezda": "red-star-belgrade",
        "Red Star Belgrade": "red-star-belgrade",
        "Young Boys": "young-boys",
        "Celtic": "celtic",

        // Pot 4
        "Slovan Bratislava": "slovan-bratislava",
        "Monaco": "monaco",
        "AS Monaco": "monaco",
        "Sparta Prague": "sparta-prague",
        "Aston Villa": "aston-villa",
        "Bologna": "bologna",
        "Girona": "girona",
        "Stuttgart": "stuttgart",
        "Sturm Graz": "sturm-graz",
        "Brest": "brest",
        "Stade Brestois": "brest",

        // Extras
        "Galatasaray": "galatasaray",
        "Bodø/Glimt": "bodo-glimt",
        "Bodø Glimt": "bodo-glimt",
        "Newcastle": "newcastle",
        "Olympiacos": "olympiacos",
        "Qarabağ": "qarabag"
    };

    let updatedCount = 0;
    for (const [name, slug] of Object.entries(ASSET_MAP)) {
         const localPath = `/assets/ucl/${slug}.svg`;
         
         // Update Home
         const resH = await queryRunner.query(
             `UPDATE matches SET "homeFlag" = $1 WHERE "homeTeam" ILIKE $2`,
             [localPath, `%${name}%`] 
         );
         
         // Update Away
         const resA = await queryRunner.query(
             `UPDATE matches SET "awayFlag" = $1 WHERE "awayTeam" ILIKE $2`,
             [localPath, `%${name}%`]
         );
         
         if ((resH && resH[1] > 0) || (resA && resA[1] > 0)) {
            console.log(`✅ ${name} -> ${localPath}`);
            updatedCount++;
         }
    }
    
    console.log(`✨ DONE. Updated ${updatedCount} teams to local assets.`);
    
    // VERIFY WC
    const wc = await queryRunner.query(`SELECT "homeTeam", "homeFlag" FROM matches WHERE "homeTeam" ILIKE '%Argentina%' LIMIT 1`);
    console.log("Verify Argentina:", JSON.stringify(wc[0], null, 2));
    
    // VERIFY UCL
    const ucl = await queryRunner.query(`SELECT "homeTeam", "homeFlag" FROM matches WHERE "homeTeam" ILIKE '%Real Madrid%' LIMIT 1`);
    console.log("Verify Real Madrid:", ucl[0]);

    await AppDataSource.destroy();
}

run().catch(e => console.error(e));
