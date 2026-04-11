const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();

// Mapeo exhaustivo de nombres en Inglés (API) a Español
const TEAM_NAMES = {
  'Argentina': 'Argentina',
  'Australia': 'Australia',
  'Austria': 'Austria',
  'Belgium': 'Bélgica',
  'Bolivia': 'Bolivia',
  'Brazil': 'Brasil',
  'Cameroon': 'Camerún',
  'Canada': 'Canadá',
  'Chile': 'Chile',
  'Colombia': 'Colombia',
  'Costa Rica': 'Costa Rica',
  'Croatia': 'Croacia',
  'Denmark': 'Dinamarca',
  'Ecuador': 'Ecuador',
  'Egypt': 'Egipto',
  'England': 'Inglaterra',
  'France': 'Francia',
  'Germany': 'Alemania',
  'Ghana': 'Ghana',
  'Iran': 'Irán',
  'Japan': 'Japón',
  'Mexico': 'México',
  'Morocco': 'Marruecos',
  'Netherlands': 'Países Bajos',
  'Panama': 'Panamá',
  'Paraguay': 'Paraguay',
  'Peru': 'Perú',
  'Poland': 'Polonia',
  'Portugal': 'Portugal',
  'Qatar': 'Catar',
  'Saudi Arabia': 'Arabia Saudí',
  'Senegal': 'Senegal',
  'Serbia': 'Serbia',
  'South Africa': 'Sudáfrica',
  'South Korea': 'República de Corea',
  'Spain': 'España',
  'Switzerland': 'Suiza',
  'Tunisia': 'Túnez',
  'United States': 'Estados Unidos',
  'Uruguay': 'Uruguay',
  'Wales': 'Gales',
  'TBD': 'TBD',
};

const FOOTBALL_DATA_API_KEY = process.env.FOOTBALL_DATA_API_KEY || '15635df62c8142119be1efd778db2fb8';
const DATABASE_URL = 'postgresql://postgres:lAbqgwhmSALnYLFxmHHTEOyuzMqqzsRS@ballast.proxy.rlwy.net:50167/railway';

async function run() {
  console.log('--- SEED WC 2026 PEOPLE PIPELINE ---');
  if (!DATABASE_URL) {
    console.error('ERROR: No se encontró DATABASE_URL en el entorno.');
    process.exit(1);
  }
  if (!FOOTBALL_DATA_API_KEY) {
    console.error('ERROR: No se encontró FOOTBALL_DATA_API_KEY en el entorno.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos de PEOPLE');

    const phaseMap = {
      'GROUP_STAGE': 'GROUP', // le añadiremos la letra del grupo
      'ROUND_OF_16': 'ROUND_32', // El mundial de 48 arranca en ROUND_32 en API de WC a veces, pero asumo lo general
      'ROUND_OF_32': 'ROUND_32',
      'QUARTER_FINALS': 'QUARTER',
      'SEMI_FINALS': 'SEMI',
      'THIRD_PLACE': '3RD_PLACE',
      'FINAL': 'FINAL'
    };

    console.log('Obteniendo partidos de football-data.org (WC)...');
    const response = await axios.get('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': FOOTBALL_DATA_API_KEY }
    });

    const matches = response.data.matches;
    console.log(`📡 Se recibieron ${matches.length} partidos de la API.`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const apiMatch of matches) {
      const externalId = apiMatch.id.toString();

      // Verificar existencia por externalId y tournamentId
      const checkRes = await client.query('SELECT id FROM matches WHERE external_id = $1 AND "tournamentId" = $2', [externalId, 'WC2026']);
      if (checkRes.rows.length > 0) {
        skippedCount++;
        continue;
      }

      // Procesar Equipo Local
      const rawHome = apiMatch.homeTeam?.name || 'TBD';
      let cleanHome = rawHome.replace('national football team', '').replace('National Team', '').trim();
      const homeTeam = TEAM_NAMES[cleanHome] || cleanHome;

      // Procesar Equipo Visitante
      const rawAway = apiMatch.awayTeam?.name || 'TBD';
      let cleanAway = rawAway.replace('national football team', '').replace('National Team', '').trim();
      const awayTeam = TEAM_NAMES[cleanAway] || cleanAway;

      // Procesar Fase
      let phase = phaseMap[apiMatch.stage] || 'GROUP';
      
      // Procesar Grupo
      let groupName = null;
      if (apiMatch.group && typeof apiMatch.group === 'string') {
        const parts = apiMatch.group.split(' ');
        if (parts.length > 1) {
          groupName = parts[1]; // ej. 'Group A' -> 'A'
        }
      }
      
      if (apiMatch.stage === 'GROUP_STAGE' && groupName) {
        phase = 'GROUP_' + groupName;
      }

      const matchDateStr = apiMatch.utcDate; // ISO format

      await client.query(`
        INSERT INTO matches (
          id, home_team, away_team, date, status, phase, 
          "group", "tournamentId", external_id, home_score, away_score
        )
        VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, 
          $6, $7, $8, null, null
        )`,
        [
          homeTeam,
          awayTeam,
          matchDateStr, 
          'PENDING',
          phase,
          groupName, 
          'WC2026',
          externalId
        ]
      );

      insertedCount++;
    }

    console.log('✅ Finalizado con éxito!');
    console.log(`- Insertados: ${insertedCount}`);
    console.log(`- Omitidos (ya existían): ${skippedCount}`);

  } catch (error) {
    console.error('ERROR FATAL:', error.message);
    if (error.response?.data) console.error(error.response.data);
  } finally {
    await client.end();
  }
}

run();
