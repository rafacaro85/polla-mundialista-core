const { Client } = require('pg');
const connectionString = 'postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway';

const r32Data = [
  { bracket_id: 1, home: '1A', away: '3C/E/F/H/I', stadium: 'Estadio Los Ángeles', date: '2026-06-28 15:00:00' },
  { bracket_id: 2, home: '1E', away: '3A/B/C/D/F', stadium: 'Estadio Boston', date: '2026-06-28 19:00:00' },
  { bracket_id: 3, home: '1F', away: '2C', stadium: 'Estadio Monterrey', date: '2026-06-29 13:00:00' },
  { bracket_id: 4, home: '2A', away: '2B', stadium: 'Estadio Houston', date: '2026-06-29 17:00:00' },
  { bracket_id: 5, home: '1I', away: '3C/D/F/G/H', stadium: 'Estadio NY/NJ', date: '2026-06-29 21:00:00' },
  { bracket_id: 6, home: '2E', away: '2I', stadium: 'Estadio Dallas', date: '2026-06-30 13:00:00' },
  { bracket_id: 7, home: '1L', away: '3E/H/I/J/K', stadium: 'Estadio Cd México', date: '2026-06-30 17:00:00' },
  { bracket_id: 8, home: '1D', away: '3B/E/F/I/J', stadium: 'Estadio Atlanta', date: '2026-06-30 21:00:00' },
  { bracket_id: 9, home: '1G', away: '3A/E/H/I/J', stadium: 'Estadio Bahía SF', date: '2026-07-01 13:00:00' },
  { bracket_id: 10, home: '2K', away: '2L', stadium: 'Estadio Seattle', date: '2026-07-01 17:00:00' },
  { bracket_id: 11, home: '1H', away: '2J', stadium: 'Estadio Toronto', date: '2026-07-01 21:00:00' },
  { bracket_id: 12, home: '1B', away: '3E/F/G/I/J', stadium: 'Estadio Los Ángeles', date: '2026-07-02 13:00:00' },
  { bracket_id: 13, home: '2D', away: '2G', stadium: 'Estadio Vancouver', date: '2026-07-02 17:00:00' },
  { bracket_id: 14, home: '1J', away: '2H', stadium: 'Estadio Miami', date: '2026-07-02 21:00:00' },
  { bracket_id: 15, home: '1K', away: '3D/E/I/J/L', stadium: 'Estadio Kansas City', date: '2026-07-03 15:00:00' },
  { bracket_id: 16, home: '1C', away: '3A/B/D/E/F', stadium: 'Estadio Dallas', date: '2026-07-03 19:00:00' }
];

async function fix() {
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();

    console.log('🔄 Checking existing matches...');
    
    for (const m of r32Data) {
        const res = await client.query('SELECT id FROM matches WHERE phase = \'ROUND_32\' AND "bracketId" = $1 AND "tournamentId" = \'WC2026\'', [m.bracket_id]);
        
        if (res.rows.length === 0) {
            console.log(`➕ Inserting missing match for Bracket ${m.bracket_id}...`);
            await client.query(`
                INSERT INTO matches (
                    "tournamentId", phase, "bracketId", "homeTeamPlaceholder", "awayTeamPlaceholder", 
                    stadium, date, status, "homeTeam", "awayTeam", "homeFlag", "awayFlag"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            `, [
                'WC2026', 'ROUND_32', m.bracket_id, m.home, m.away,
                m.stadium, m.date, 'PENDING', '', '', 'un', 'un'
            ]);
        } else {
            console.log(`✅ Match for Bracket ${m.bracket_id} already exists.`);
        }
    }

    console.log('✅ Fix completed!');
    await client.end();
}

fix();
