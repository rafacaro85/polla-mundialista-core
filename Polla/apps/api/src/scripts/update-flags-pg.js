
const { Client } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../../../.env') });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const T_ID = 'UCL2526';
const BASE_PATH = '/images/escudos/';

const TEAM_MAP = {
    'Arsenal': 'arsenal-footballlogos-org.svg', // Missing in list, assume default pattern if exists or map correctly if not found
    'Atalanta': 'atalanta-footballlogos-org.svg',
    'Atlético Madrid': 'atletico-madrid-footballlogos-org.svg',
    'Barcelona': 'fc-barcelona-footballlogos-org.svg', // Guessing, verify if in list
    'Bayern Munich': 'bayern-munchen-footballlogos-org.svg', // Guessing
    'Benfica': 'sl-benfica-footballlogos-org.svg',
    'Bodo/Glimt': 'bodo-glimt-footballlogos-org.svg',
    'Chelsea': 'chelsea-fc-footballlogos-org.svg', // Guessing
    'Club Brujas': 'club-brugge-footballlogos-org.svg',
    'Dortmund': 'borussia-dortmund-footballlogos-org.svg',
    'Galatasaray': 'galatasaray-footballlogos-org.svg',
    'Inter': 'inter-milan-footballlogos-org.svg',
    'Juventus': 'juventus-footballlogos-org.svg',
    'Leverkusen': 'bayer-leverkusen-footballlogos-org.svg',
    'Liverpool': 'liverpool-fc-footballlogos-org.svg', // Guessing
    'Manchester City': 'manchester-city-footballlogos-org.svg', // Guessing
    'Monaco': 'as-monaco-footballlogos-org.svg',
    'Newcastle': 'newcastle-united-footballlogos-org.svg',
    'Olympiacos': 'olympiacos-footballlogos-org.svg',
    'PSG': 'paris-saint-germain-footballlogos-org.svg',
    'Qarabag': 'qarabag-fk-footballlogos-org.svg',
    'Real Madrid': 'real-madrid-footballlogos-org.svg',
    'Sporting Lisboa': 'sporting-clube-de-portugal-footballlogos-org.svg', // Guessing
    'Tottenham': 'tottenham-hotspur-footballlogos-org.svg' // Guessing
};

// Only update the ones explicitly found in the file list provided
const ACTUAL_FILES = [
    "as-monaco-footballlogos-org.svg",
    "atalanta-footballlogos-org.svg",
    "atletico-madrid-footballlogos-org.svg",
    "bayer-leverkusen-footballlogos-org.svg",
    "bodo-glimt-footballlogos-org.svg",
    "borussia-dortmund-footballlogos-org.svg",
    "club-brugge-footballlogos-org.svg",
    "galatasaray-footballlogos-org.svg",
    "inter-milan-footballlogos-org.svg",
    "juventus-footballlogos-org.svg",
    "newcastle-united-footballlogos-org.svg",
    "olympiacos-footballlogos-org.svg",
    "paris-saint-germain-footballlogos-org.svg",
    "qarabag-fk-footballlogos-org.svg",
    "real-madrid-footballlogos-org.svg",
    "sl-benfica-footballlogos-org.svg"
];

async function main() {
    try {
        await client.connect();
        console.log('Connected to DB');

        for (const [teamName, filename] of Object.entries(TEAM_MAP)) {
            if (ACTUAL_FILES.includes(filename)) {
                const fullPath = BASE_PATH + filename;
                
                // Update Home
                const resH = await client.query(`
                    UPDATE matches 
                    SET "homeFlag" = $1 
                    WHERE "tournamentId" = $2 AND "homeTeam" = $3
                `, [fullPath, T_ID, teamName]);
                
                // Update Away
                const resA = await client.query(`
                    UPDATE matches 
                    SET "awayFlag" = $1 
                    WHERE "tournamentId" = $2 AND "awayTeam" = $3
                `, [fullPath, T_ID, teamName]);

                console.log(`Updated ${teamName}: H=${resH.rowCount}, A=${resA.rowCount}`);
            } else {
                console.log(`Skipping ${teamName} (Image not provided: ${filename})`);
            }
        }

    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

main();
