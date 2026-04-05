const https = require('https');
const { Pool } = require('pg');
require('dotenv').config({ path: [__dirname + '/../.env.local', __dirname + '/../.env'] });

// Mapa de traducción nombres inglés → español
const TEAM_NAMES = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'República de Corea',
  'Korea Republic': 'República de Corea',
  'Czech Republic': 'República Checa',
  'Czechia': 'República Checa',
  'Bosnia and Herzegovina': 'Bosnia & Herzegovina',
  'Bosnia & Herzegovina': 'Bosnia & Herzegovina',
  'United States': 'Estados Unidos',
  'USA': 'Estados Unidos',
  'Ivory Coast': 'Costa del Marfil',
  "Côte d'Ivoire": 'Costa del Marfil',
  'Iran': 'Irán',
  'Serbia': 'Serbia',
  'Croatia': 'Croacia',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Curacao': 'Curazao',
  'Curaçao': 'Curazao',
  'Saudi Arabia': 'Arabia Saudí',
  'Congo DR': 'República del Congo',
  'Congo': 'República del Congo',
  'DR Congo': 'República del Congo',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Cape Verde Islands': 'Cabo Verde',
  'Peru': 'Perú',
  'Denmark': 'Dinamarca',
  'Romania': 'Rumania',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Ecuador': 'Ecuador',
  'Venezuela': 'Venezuela',
  'Uruguay': 'Uruguay',
  'Kuwait': 'Kuwait',
  'Spain': 'España',
  'Thailand': 'Tailandia',
  'Chile': 'Chile',
  'Tunisia': 'Túnez',
  'Japan': 'Japón',
  'Nigeria': 'Nigeria',
  'Guinea': 'Guinea',
  'Brazil': 'Brasil',
  'Honduras': 'Honduras',
  'Ukraine': 'Ucrania',
  'Uzbekistan': 'Uzbekistán',
  'France': 'Francia',
  'Ghana': 'Ghana',
  'Portugal': 'Portugal',
  'Scotland': 'Escocia',
  'England': 'Inglaterra',
  'Senegal': 'Senegal',
  'Netherlands': 'Países Bajos',
  'Belgium': 'Bélgica',
  'Germany': 'Alemania',
  'Colombia': 'Colombia',
  'Canada': 'Canadá',
  'Australia': 'Australia',
  'Poland': 'Polonia',
  'Switzerland': 'Suiza',
  'Qatar': 'Catar',
  'Egypt': 'Egipto',
  'Cameroon': 'Camerún',
  'Mali': 'Malí',
  'Paraguay': 'Paraguay',
  'Bolivia': 'Bolivia',
  'Costa Rica': 'Costa Rica',
  'Panama': 'Panamá',
  'Jamaica': 'Jamaica',
  'Turkey': 'Turquía',
  'Türkiye': 'Turquía',
  'Greece': 'Grecia',
  'Hungary': 'Hungría',
  'Slovakia': 'Eslovaquia',
  'Slovenia': 'Eslovenia',
  'Albania': 'Albania',
  'Israel': 'Israel',
  'Iraq': 'Irak',
  'Oman': 'Omán',
  'United Arab Emirates': 'Emiratos Árabes',
  'New Zealand': 'Nueva Zelanda',
  'Indonesia': 'Indonesia',
  'Wales': 'Gales',
  'Sweden': 'Suecia',
  'Finland': 'Finlandia',
  'Russia': 'Rusia',
  'China PR': 'China',
  'China': 'China',
  'India': 'India',
  'Bahrain': 'Baréin',
  'Libya': 'Libia',
  'Tanzania': 'Tanzania',
  'Mozambique': 'Mozambique',
  'Cape Verde': 'Cabo Verde',
  'Benin': 'Benín',
  'Burkina Faso': 'Burkina Faso',
  'Equatorial Guinea': 'Guinea Ecuatorial',
  'Placeholder A': 'PLA_A',
  'Placeholder B': 'PLA_B',
  'Placeholder C': 'PLA_C',
  'Placeholder D': 'PLA_D',
  'Placeholder E': 'PLA_E',
  'Placeholder F': 'PLA_F',
};

async function seedExternalIds() {
  const pool = new Pool({ 
    connectionString: "postgresql://postgres:avGqbrYAATosnLtZRocccAERatFrfyEw@shortline.proxy.rlwy.net:13451/railway", 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    // 1. Traer partidos de football-data.org (usando HTTPS nativo para EVITAR el error de IPv6)
    console.log("📡 Descargando fixtures de football-data.org...");
    const apiMatches = await new Promise((resolve, reject) => {
      https.get('https://api.football-data.org/v4/competitions/WC/matches', {
        headers: { 'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve(JSON.parse(data).matches));
      }).on('error', reject);
    });

    if (!apiMatches) throw new Error("No se obtuvieron matches de la API.");

    // 2. Traer partidos de la BD
    const { rows: dbMatches } = await pool.query(`
      SELECT id, "homeTeam", "awayTeam", date
      FROM matches
      WHERE "tournamentId" = 'WC2026'
      ORDER BY date ASC
    `);

    console.log(`API: ${apiMatches.length} partidos`);
    console.log(`BD:  ${dbMatches.length} partidos`);

    let updated = 0;
    let notFound = [];

    for (const dbMatch of dbMatches) {
      const dbHome = dbMatch.homeTeam || '';
      const dbAway = dbMatch.awayTeam || '';

      let apiMatch = apiMatches.find(m => {
        if (!m.homeTeam?.name && !m.awayTeam?.name) return false;
        
        const homeName = m.homeTeam?.name || '';
        const awayName = m.awayTeam?.name || '';
        const apiHome = TEAM_NAMES[homeName] || homeName;
        const apiAway = TEAM_NAMES[awayName] || awayName;
        
        return (apiHome === dbHome && apiAway === dbAway) || (apiHome === dbAway && apiAway === dbHome);
      });

      if (!apiMatch && dbHome === '' && dbAway === '') {
        const dbTBDs = dbMatches.filter(x => !x.homeTeam && !x.awayTeam);
        const indexTBD = dbTBDs.indexOf(dbMatch);
        const apiTBDMatches = apiMatches.filter(m => !m.homeTeam?.name && !m.awayTeam?.name).sort((a,b) => new Date(a.utcDate) - new Date(b.utcDate));
        if (apiTBDMatches[indexTBD]) apiMatch = apiTBDMatches[indexTBD];
      }

      if (apiMatch) {
        const isSwapped = (TEAM_NAMES[apiMatch.homeTeam?.name || ''] || apiMatch.homeTeam?.name) === dbAway;
        
        if (isSwapped) {
          await pool.query(`
            UPDATE matches SET "externalId" = $1, "homeTeam" = $2, "awayTeam" = $3 WHERE id = $4
          `, [apiMatch.id, dbAway, dbHome, dbMatch.id]);
          console.log(`✅ [🔀 INVERTIDO A ORDEN OFICIAL] ${dbAway} vs ${dbHome} → ${apiMatch.id}`);
        } else {
          await pool.query(`
            UPDATE matches SET "externalId" = $1 WHERE id = $2
          `, [apiMatch.id, dbMatch.id]);
          console.log(`✅ ${dbHome} vs ${dbAway} → ${apiMatch.id}`);
        }
        updated++;
      } else {
        notFound.push(`${dbHome} vs ${dbAway}`);
      }
    }

    console.log(`\n✅ Actualizados: ${updated}/${dbMatches.length}`);
    if (notFound.length > 0) {
      console.log(`\n❌ No encontrados en DB (${notFound.length}):`);
      notFound.forEach(m => console.log(`  - ${m}`));
      
      console.log(`\n🔎 Algunos de los equipos que reporta la API y NO logramos cruzar:`);
      const unmatchedApiCount = apiMatches.filter(m => !dbMatches.some(db => 
        (db.homeTeam || '') === (TEAM_NAMES[m.homeTeam?.name] || m.homeTeam?.name || '') && 
        (db.awayTeam || '') === (TEAM_NAMES[m.awayTeam?.name] || m.awayTeam?.name || '')
      ) && m.homeTeam?.name);
      
      unmatchedApiCount.slice(0, 15).forEach(m => console.log(`  ° API dice: ${m.homeTeam?.name} vs ${m.awayTeam?.name}`));
    }
  } catch(e) {
    console.error("❌ ERROR CRÍTICO:", e.message);
  } finally {
    await pool.end();
  }
}

seedExternalIds().catch(console.error);
