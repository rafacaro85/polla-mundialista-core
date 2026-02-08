import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  synchronize: false,
});

// MAPA ROBUSTO DE ESCUDOS (Incluye variantes de nombres para asegurar coincidencia)
const UCL_LOGOS_MAPPING: Record<string, string> = {
  // --- PORTUGAL ---
  Benfica:
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/SL_Benfica_logo.svg',
  'S.L. Benfica':
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/SL_Benfica_logo.svg',
  'SL Benfica':
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/SL_Benfica_logo.svg',
  'Sporting CP':
    'https://upload.wikimedia.org/wikipedia/commons/e/e1/Sporting_Clube_de_Portugal_(Complex).svg',
  'Sporting Lisbon':
    'https://upload.wikimedia.org/wikipedia/commons/e/e1/Sporting_Clube_de_Portugal_(Complex).svg',

  // --- FRANCIA ---
  Monaco:
    'https://upload.wikimedia.org/wikipedia/commons/fd/AS_Monaco_FC_logo.svg',
  'AS Monaco':
    'https://upload.wikimedia.org/wikipedia/commons/fd/AS_Monaco_FC_logo.svg',
  'A.S. Monaco':
    'https://upload.wikimedia.org/wikipedia/commons/fd/AS_Monaco_FC_logo.svg',
  PSG: 'https://upload.wikimedia.org/wikipedia/commons/a/a7/Paris_Saint-Germain_F.C..svg',
  'Paris Saint-Germain':
    'https://upload.wikimedia.org/wikipedia/commons/a/a7/Paris_Saint-Germain_F.C..svg',
  Lille:
    'https://upload.wikimedia.org/wikipedia/commons/6/6f/LOSC_Lille_Logo.svg',
  'LOSC Lille':
    'https://upload.wikimedia.org/wikipedia/commons/6/6f/LOSC_Lille_Logo.svg',
  Brest:
    'https://upload.wikimedia.org/wikipedia/commons/0/06/Stade_Brestois_29_logo.svg',
  'Stade Brestois':
    'https://upload.wikimedia.org/wikipedia/commons/0/06/Stade_Brestois_29_logo.svg',

  // --- ITALIA ---
  Juventus:
    'https://upload.wikimedia.org/wikipedia/commons/5/51/Juventus_FC_2017_logo.svg',
  'Juventus FC':
    'https://upload.wikimedia.org/wikipedia/commons/5/51/Juventus_FC_2017_logo.svg',
  Inter:
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Inter Milan':
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  Internazionale:
    'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'AC Milan':
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  Milan:
    'https://upload.wikimedia.org/wikipedia/commons/d/d0/Logo_of_AC_Milan.svg',
  Atalanta: 'https://upload.wikimedia.org/wikipedia/en/6/66/AtalantaBC.svg', // Solo EN disponible reliable
  Bologna:
    'https://upload.wikimedia.org/wikipedia/commons/5/5b/Bologna_F.C._1909_logo.svg',
  'Bologna FC':
    'https://upload.wikimedia.org/wikipedia/commons/5/5b/Bologna_F.C._1909_logo.svg',

  // --- ESPAÑA ---
  'Real Madrid':
    'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg', // Este funcionaba
  Barcelona:
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_(crest).svg',
  'FC Barcelona':
    'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_(crest).svg',
  'Atletico Madrid':
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Atlético de Madrid':
    'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  Girona: 'https://upload.wikimedia.org/wikipedia/en/9/90/For_Girona_FC.svg',
  'Girona FC':
    'https://upload.wikimedia.org/wikipedia/en/9/90/For_Girona_FC.svg',

  // --- INGLATERRA ---
  'Manchester City':
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Man City':
    'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  Arsenal: 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  Liverpool: 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Liverpool FC':
    'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Aston Villa':
    'https://upload.wikimedia.org/wikipedia/en/9/9f/Aston_Villa_logo.svg',
  Newcastle:
    'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',

  // --- ALEMANIA ---
  'Bayern Munich':
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_(2017).svg',
  'Bayern München':
    'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_München_logo_(2017).svg',
  Dortmund:
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Borussia Dortmund':
    'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'Bayer Leverkusen':
    'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  Leverkusen:
    'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  Leipzig:
    'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  'RB Leipzig':
    'https://upload.wikimedia.org/wikipedia/en/0/04/RB_Leipzig_2014_logo.svg',
  Stuttgart:
    'https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg',
  'VfB Stuttgart':
    'https://upload.wikimedia.org/wikipedia/commons/e/eb/VfB_Stuttgart_1893_Logo.svg',

  // --- OTROS ---
  PSV: 'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',
  'PSV Eindhoven':
    'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',
  Feyenoord:
    'https://upload.wikimedia.org/wikipedia/commons/2/24/Logo_Feyenoord_Rotterdam.svg',
  Celtic: 'https://upload.wikimedia.org/wikipedia/en/3/35/Celtic_FC.svg',
  'Club Brugge':
    'https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg',
  'Club Brugge KV':
    'https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg',
  Galatasaray:
    'https://upload.wikimedia.org/wikipedia/commons/f/f6/Galatasaray_Sports_Club_Logo.svg',
  'Sparta Prague':
    'https://upload.wikimedia.org/wikipedia/en/4/43/AC_Sparta_Praha_logo.svg',
  'AC Sparta Prague':
    'https://upload.wikimedia.org/wikipedia/en/4/43/AC_Sparta_Praha_logo.svg',
  'Slovan Bratislava':
    'https://upload.wikimedia.org/wikipedia/commons/a/a2/ŠK_Slovan_Bratislava_logo.svg',
  'Shakhtar Donetsk':
    'https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg',
  'Young Boys':
    'https://upload.wikimedia.org/wikipedia/commons/6/6b/BSC_Young_Boys_logo.svg',
  'BSC Young Boys':
    'https://upload.wikimedia.org/wikipedia/commons/6/6b/BSC_Young_Boys_logo.svg',
  Salzburg:
    'https://upload.wikimedia.org/wikipedia/en/e/e1/Red_Bull_Salzburg_logo.svg',
  'Red Bull Salzburg':
    'https://upload.wikimedia.org/wikipedia/en/e/e1/Red_Bull_Salzburg_logo.svg',
  'RB Salzburg':
    'https://upload.wikimedia.org/wikipedia/en/e/e1/Red_Bull_Salzburg_logo.svg',
  'Sturm Graz':
    'https://upload.wikimedia.org/wikipedia/commons/0/06/SK_Sturm_Graz_Logo.svg',
  'Dinamo Zagreb':
    'https://upload.wikimedia.org/wikipedia/commons/2/23/NK_Dinamo_Zagreb.svg',
  'GNK Dinamo Zagreb':
    'https://upload.wikimedia.org/wikipedia/commons/2/23/NK_Dinamo_Zagreb.svg',
  'Crvena Zvezda':
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg',
  'Red Star Belgrade':
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg',

  // --- MISSING UPDATES ---
  'Bodø/Glimt':
    'https://upload.wikimedia.org/wikipedia/en/f/f3/FK_Bodø_Glimt.svg',
  Olympiacos:
    'https://upload.wikimedia.org/wikipedia/commons/d/d7/Olympiacos_FC_logo.svg',
  Qarabağ:
    'https://upload.wikimedia.org/wikipedia/commons/9/93/FK_Qarabag_Logo.svg',
};

async function fixUclLogos() {
  try {
    console.log('Connecting to DB...');
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();

    console.log('🔄 Iniciando reparación INTELIGENTE de escudos UCL...');

    // 1. Obtener todos los nombres de equipos DISTINTOS usados en UCL2526
    // Unimos homeTeam y awayTeam
    const teamsRaw = await queryRunner.query(`
            SELECT DISTINCT "homeTeam" as name FROM matches WHERE "tournamentId" = 'UCL2526'
            UNION
            SELECT DISTINCT "awayTeam" as name FROM matches WHERE "tournamentId" = 'UCL2526' AND "awayTeam" IS NOT NULL
        `);

    // Remove nulls/placeholders manually if needed, or rely on them not being in map
    const dbTeamNames = teamsRaw
      .map((r: any) => r.name)
      .filter((n: string) => n && n.length > 2);

    console.log(
      `ℹ️ Equipos encontrados en DB (Partidos UCL): ${dbTeamNames.length}`,
    );

    let missingCount = 0;
    let updatedMatchesCount = 0;

    // 2. Intentar hacer match con el mapa
    for (const teamName of dbTeamNames) {
      const logoUrl = UCL_LOGOS_MAPPING[teamName];

      if (logoUrl) {
        // Update Home
        const resHome = await queryRunner.query(
          `
                    UPDATE matches SET "homeFlag" = $1 WHERE "homeTeam" = $2 AND "tournamentId" = 'UCL2526'
                `,
          [logoUrl, teamName],
        );

        // Update Away
        const resAway = await queryRunner.query(
          `
                    UPDATE matches SET "awayFlag" = $1 WHERE "awayTeam" = $2 AND "tournamentId" = 'UCL2526'
                `,
          [logoUrl, teamName],
        );

        const changed = (resHome[1] || 0) + (resAway[1] || 0);
        if (changed > 0) {
          updatedMatchesCount += changed;
          // console.log(`✅ OK: ${teamName}`); // Uncomment for verbose
        }
      } else {
        console.warn(`❌ MISSING: "${teamName}" (Cópialo al JSON)`);
        missingCount++;
      }
    }

    console.log(`\n🏁 RESUMEN:`);
    console.log(`✅ Partidos actualizados: ${updatedMatchesCount}`);
    console.log(`⚠️ Equipos SIN mapa: ${missingCount}`);

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error fixing logos:', error);
    process.exit(1);
  }
}

fixUclLogos();
