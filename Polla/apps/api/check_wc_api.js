require('dotenv').config();


const https = require('https');

async function checkMatches() {
  const token = process.env.FOOTBALL_DATA_API_KEY;
  if (!token) {
    console.error("❌ ERROR: FOOTBALL_DATA_API_KEY no detectado.");
    process.exit(1);
  }

  const options = {
    hostname: 'api.football-data.org',
    path: '/v4/competitions/WC/matches',
    method: 'GET',
    headers: {
      'X-Auth-Token': token
    }
  };

  const req = https.request(options, (res) => {
    let rawData = '';

    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
      if (res.statusCode !== 200) {
        console.error(`❌ HTTP Error ${res.statusCode}:`, rawData);
        return;
      }
      try {
        const data = JSON.parse(rawData);
        console.log('Total partidos:', data.matches?.length);
        console.log('Primer partido:', JSON.stringify(data.matches?.[0] || {}, null, 2));
        console.log('Estados disponibles:', [...new Set(data.matches?.map(m => m.status))]);
      } catch (e) {
        console.error("❌ Error parseando JSON:", e.message);
      }
    });
  });

  req.on('error', (e) => {
    console.error("❌ ERROR FÍSICO DE RED:", e.message);
    console.error(e);
  });

  req.end();
}

checkMatches().catch(console.error);
