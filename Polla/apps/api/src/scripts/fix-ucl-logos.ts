import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    synchronize: false,
});

const UCL_LOGOS_MAPPING: Record<string, string> = {
  // Equipos Play-offs y Top (Nombres en español o inglés según tu DB)
  "Benfica": "https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg",
  "Monaco": "https://upload.wikimedia.org/wikipedia/en/fd/AS_Monaco_FC_logo.svg",
  "Juventus": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Juventus_FC_2017_logo.svg/1200px-Juventus_FC_2017_logo.svg.png",
  "Real Madrid": "https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg",
  "Paris Saint-Germain": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "PSG": "https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg",
  "Manchester City": "https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg",
  "Bayern Munich": "https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg",
  "Liverpool": "https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg",
  "Barcelona": "https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg",
  "Inter Milan": "https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg",
  "Arsenal": "https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg",
  "Atletico Madrid": "https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg",
  "Bayer Leverkusen": "https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg",
  "Aston Villa": "https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg",
  "Dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "Borussia Dortmund": "https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg",
  "Leipzig": "https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg",
  "Brest": "https://upload.wikimedia.org/wikipedia/en/0/06/Stade_Brestois_29_logo.svg",
  "Atalanta": "https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg",
  "Stuttgart": "https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg",
  "Sporting CP": "https://upload.wikimedia.org/wikipedia/en/e/e1/Sporting_Clube_de_Portugal_%28Complex%29.svg",
  "Feyenoord": "https://upload.wikimedia.org/wikipedia/en/e/e3/Feyenoord_logo.svg",
  "Lille": "https://upload.wikimedia.org/wikipedia/en/3/3f/LOSC_Lille_Logo.svg",
  "PSV Eindhoven": "https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg",
  "PSV": "https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg",
  "Celtic": "https://upload.wikimedia.org/wikipedia/en/3/35/Celtic_FC.svg",
  "Club Brugge": "https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg",
  "Galatasaray": "https://upload.wikimedia.org/wikipedia/en/3/31/Galatasaray_Star_Logo.svg",
  "AC Milan": "https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg",
  "Sparta Prague": "https://upload.wikimedia.org/wikipedia/en/4/43/AC_Sparta_Praha_logo.svg",
  "Slovan Bratislava": "https://upload.wikimedia.org/wikipedia/en/7/74/SK_Slovan_Bratislava_logo.svg",
  "Shakhtar Donetsk": "https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg",
  "Young Boys": "https://upload.wikimedia.org/wikipedia/en/6/6b/BSC_Young_Boys_logo.svg",
  "Red Bull Salzburg": "https://upload.wikimedia.org/wikipedia/en/e/e1/Red_Bull_Salzburg_logo.svg",
  "Girona": "https://upload.wikimedia.org/wikipedia/en/9/90/For_Girona_FC.svg",
  "Bologna": "https://upload.wikimedia.org/wikipedia/en/5/5b/Bologna_F.C._1909_logo.svg",
  "Sturm Graz": "https://upload.wikimedia.org/wikipedia/commons/0/06/SK_Sturm_Graz_Logo.svg",
  "Dinamo Zagreb": "https://upload.wikimedia.org/wikipedia/en/6/65/NK_Dinamo_Zagreb_2024.svg",
  "Crvena Zvezda": "https://upload.wikimedia.org/wikipedia/en/f/f3/NK_Crvena_zvezda.svg"
};

async function fixLogos() {
    try {
        console.log('Connecting to DB...');
        await AppDataSource.initialize();
        const queryRunner = AppDataSource.createQueryRunner();
        
        console.log(`🚀 [UCL LOGOS FIX] Iniciando actualización de ${Object.keys(UCL_LOGOS_MAPPING).length} equipos...`);

        let updatedCount = 0;

        for (const [teamName, logoUrl] of Object.entries(UCL_LOGOS_MAPPING)) {
            // Update Home Team flags
            const homeResult = await queryRunner.query(`
                UPDATE matches 
                SET "homeFlag" = $1 
                WHERE "homeTeam" = $2 AND "tournamentId" = 'UCL2526'
            `, [logoUrl, teamName]);

            // Update Away Team flags
            const awayResult = await queryRunner.query(`
                UPDATE matches 
                SET "awayFlag" = $1 
                WHERE "awayTeam" = $2 AND "tournamentId" = 'UCL2526'
            `, [logoUrl, teamName]);

            const total = (homeResult[1] || 0) + (awayResult[1] || 0);
            if (total > 0) {
                console.log(`✅ ${teamName}: ${total} partidos actualizados.`);
                updatedCount += total;
            }
        }

        console.log(`✨ DONE! Total de partidos actualizados: ${updatedCount}`);
        await AppDataSource.destroy();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing logos:', error);
        process.exit(1);
    }
}

fixLogos();
