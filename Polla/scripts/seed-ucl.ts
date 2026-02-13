
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Force load env
let envFile = path.resolve(process.cwd(), '.env');
const attempts = [
    path.resolve(process.cwd(), '.env.production.temp'),
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'apps/api/.env'),
    path.resolve(process.cwd(), '../apps/api/.env'),
    path.resolve(process.cwd(), '../../apps/api/.env'),
    'C:/AppWeb/Polla/apps/api/.env'
];

for (const p of attempts) {
    if (fs.existsSync(p)) {
        envFile = p;
        break;
    }
}
console.log('Loading .env from:', envFile);
dotenv.config({ path: envFile });

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'polla_mundialista',
  synchronize: false,
  ssl: process.env.DB_HOST === 'localhost' ? false : { rejectUnauthorized: false }, 
});

async function runSeed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Connected to DB');

    // 1. DELETE OLD UCL MATCHES
    await AppDataSource.query(`DELETE FROM matches WHERE "tournamentId" = 'UCL2526'`);
    await AppDataSource.query(`DELETE FROM knockout_phase_status WHERE "tournamentId" = 'UCL2526'`);
    console.log('🗑️ Deleted old UCL data');

    // 2. DEFINE PHASE STATUSES
    const PHASES = [
      { p: 'PLAYOFF_1', unlocked: true },
      { p: 'PLAYOFF_2', unlocked: false }, 
      { p: 'ROUND_16', unlocked: false }, 
      { p: 'QUARTER', unlocked: false },
      { p: 'SEMI', unlocked: false },
      { p: 'FINAL', unlocked: false }
    ];

    for (const ph of PHASES) {
        await AppDataSource.query(`
            INSERT INTO knockout_phase_status ("phase", "tournamentId", "is_unlocked", "unlocked_at", "all_matches_completed")
            VALUES ($1, 'UCL2526', $2, NOW(), false)
        `, [ph.p, ph.unlocked]);
    }

    // 3. DEFINE MATCHES (Replicating service logic manually with basic SQL to avoid needing entity/service)
    
    // PLAYOFFS (IDA)
    const PLAYOFF_IDA = [
        ['Galatasaray', 'Juventus', '2026-02-17 17:45:00', 'PENDING', 'PLAYOFF_1'], 
        ['Dortmund', 'Atalanta', '2026-02-17 20:00:00', 'PENDING', 'PLAYOFF_1'],
        ['Monaco', 'PSG', '2026-02-17 20:00:00', 'PENDING', 'PLAYOFF_1'],
        ['Benfica', 'Real Madrid', '2026-02-17 20:00:00', 'PENDING', 'PLAYOFF_1'],
        ['Qarabag', 'Newcastle', '2026-02-18 17:45:00', 'PENDING', 'PLAYOFF_1'],
        ['Olympiacos', 'Leverkusen', '2026-02-18 20:00:00', 'PENDING', 'PLAYOFF_1'],
        ['Bodo/Glimt', 'Inter', '2026-02-18 20:00:00', 'PENDING', 'PLAYOFF_1'],
        ['Club Brujas', 'Atlético Madrid', '2026-02-18 20:00:00', 'PENDING', 'PLAYOFF_1'],
    ];

    // PLAYOFFS (VUELTA)
    const PLAYOFF_VUELTA = [
        ['Atlético Madrid', 'Club Brujas', '2026-02-24 17:45:00', 'PENDING', 'PLAYOFF_2'],
        ['Newcastle', 'Qarabag', '2026-02-24 20:00:00', 'PENDING', 'PLAYOFF_2'],
        ['Leverkusen', 'Olympiacos', '2026-02-24 20:00:00', 'PENDING', 'PLAYOFF_2'],
        ['Atalanta', 'Dortmund', '2026-02-25 17:45:00', 'PENDING', 'PLAYOFF_2'],
        ['PSG', 'Monaco', '2026-02-25 20:00:00', 'PENDING', 'PLAYOFF_2'],
        ['Real Madrid', 'Benfica', '2026-02-25 20:00:00', 'PENDING', 'PLAYOFF_2'],
        ['Juventus', 'Galatasaray', '2026-02-25 20:00:00', 'PENDING', 'PLAYOFF_2'],
        ['Inter', 'Bodo/Glimt', '2026-02-24 20:00:00', 'PENDING', 'PLAYOFF_2'],
    ];

    // OCTAVOS (IDA) - Updated Top 8
    const OCTAVOS = [
      ['', 'Arsenal', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 1, 'Ganador Play-off', '', 'Emirates Stadium'],
      ['', 'Bayern Munich', '2026-03-10 20:00:00', 'PENDING', 'ROUND_16', 2, 'Ganador Play-off', '', 'Allianz Arena'],
      ['', 'Liverpool', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 3, 'Ganador Play-off', '', 'Anfield'],
      ['', 'Tottenham', '2026-03-11 20:00:00', 'PENDING', 'ROUND_16', 4, 'Ganador Play-off', '', 'Tottenham Hotspur Stadium'],
      ['', 'Barcelona', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 5, 'Ganador Play-off', '', 'Camp Nou'],
      ['', 'Chelsea', '2026-03-17 20:00:00', 'PENDING', 'ROUND_16', 6, 'Ganador Play-off', '', 'Stamford Bridge'],
      ['', 'Sporting Lisboa', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 7, 'Ganador Play-off', '', 'Estádio José Alvalade'],
      ['', 'Manchester City', '2026-03-18 20:00:00', 'PENDING', 'ROUND_16', 8, 'Ganador Play-off', '', 'Etihad Stadium'],
    ];

    // OCTAVOS (VUELTA) - Swapped Home/Away
    const OCTAVOS_VUELTA = [
      ['Arsenal', '', '2026-03-24 20:00:00', 'PENDING', 'ROUND_16', 1, '', 'Ganador Play-off', 'Emirates Stadium'],
      ['Bayern Munich', '', '2026-03-24 20:00:00', 'PENDING', 'ROUND_16', 2, '', 'Ganador Play-off', 'Allianz Arena'],
      ['Liverpool', '', '2026-03-25 20:00:00', 'PENDING', 'ROUND_16', 3, '', 'Ganador Play-off', 'Anfield'],
      ['Tottenham', '', '2026-03-25 20:00:00', 'PENDING', 'ROUND_16', 4, '', 'Ganador Play-off', 'Tottenham Hotspur Stadium'],
      ['Barcelona', '', '2026-03-31 20:00:00', 'PENDING', 'ROUND_16', 5, '', 'Ganador Play-off', 'Camp Nou'],
      ['Chelsea', '', '2026-04-01 20:00:00', 'PENDING', 'ROUND_16', 6, '', 'Ganador Play-off', 'Stamford Bridge'],
      ['Sporting Lisboa', '', '2026-04-01 20:00:00', 'PENDING', 'ROUND_16', 7, '', 'Ganador Play-off', 'Estádio José Alvalade'],
      ['Manchester City', '', '2026-04-01 20:00:00', 'PENDING', 'ROUND_16', 8, '', 'Ganador Play-off', 'Etihad Stadium'],
    ];

    // Note: Leaving Quarter/Semi/Final implementation skipped in script to focus on fix, but service has it.
    // Ideally script should call service logic but here we replicate for speed.
    // For now we just implement the requested fix (Round 16 seeds).

    const TEAMS: Record<string, string> = {
      'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
      'Real Madrid': 'https://upload.wikimedia.org/wikipedia/en/5/56/Real_Madrid_CF.svg',
      'Bayern Munich': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
      'Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
      'Inter Milan': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      'Inter': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
      'Arsenal': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
      'Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
      'PSG': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',
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
      'Club Brujas': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg',
      'Tottenham': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
      'Chelsea': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
      'Sporting Lisboa': 'https://upload.wikimedia.org/wikipedia/en/e/e1/Sporting_Clube_de_Portugal_%28Logo%29.svg'
    };

    const getLogo = (t: string) => TEAMS[t] || '';

    // INSERT FUNCTION
    const insertMatch = async (m: any[]) => {
        const [h, a, d, s, p, bid, hP, aP, stad] = m;
        await AppDataSource.query(`
            INSERT INTO matches ("homeTeam", "awayTeam", "date", "status", "phase", "bracketId", "homeTeamPlaceholder", "awayTeamPlaceholder", "stadium", "tournamentId", "homeFlag", "awayFlag", "homeScore", "awayScore")
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'UCL2526', $10, $11, 0, 0)
        `, [h, a, d, s, p, bid || null, hP || null, aP || null, stad || null, getLogo(h), getLogo(a)]);
    };

    for (const m of PLAYOFF_IDA) await insertMatch([...m, null, null, null, null]);
    for (const m of PLAYOFF_VUELTA) await insertMatch([...m, null, null, null, null]);
    for (const m of OCTAVOS) await insertMatch(m);
    for (const m of OCTAVOS_VUELTA) await insertMatch(m);

    console.log('✅ Updated UCL teams successfully');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await AppDataSource.destroy();
  }
}

runSeed();
