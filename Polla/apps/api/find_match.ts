import axios from 'axios';

async function findMatchID() {
    console.log('📡 Iniciando escaneo de partidos para hoy (2025-12-04)...');

    const config = {
        method: 'get',
        url: 'https://v3.football.api-sports.io/fixtures',
        params: { date: '2025-12-04', timezone: 'America/Bogota' },
        headers: {
            'x-rapidapi-key': 'fcbd1d541b1e7abc6d65994a497d95fb',
            'x-rapidapi-host': 'v3.football.api-sports.io'
        }
    };

    try {
        const response = await axios(config);
        const matches = response.data.response;

        if (!matches || matches.length === 0) {
            console.log('⚠️ La API respondió OK, pero no encontró partidos. Revisa la fecha.');
            // Imprimir respuesta cruda por si hay errores de plan
            console.log('Respuesta:', JSON.stringify(response.data).substring(0, 200));
        } else {
            console.log(`✅ ¡ÉXITO! Se encontraron ${matches.length} partidos:`);
            console.log('------------------------------------------------');
            matches.forEach((m: any) => {
                // Imprimimos en formato fácil de leer
                console.log(`⚽ ${m.teams.home.name} vs ${m.teams.away.name}`);
                console.log(`🆔 ID PARA COPIAR: ${m.fixture.id}`);
                console.log(`⏰ Estado: ${m.fixture.status.long} (${m.fixture.status.elapsed}')`);
                console.log('------------------------------------------------');
            });
        }
    } catch (error: any) {
        console.error('❌ ERROR FATAL DE CONEXIÓN:');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Mensaje API:', error.response.data);
            if (error.response.status === 403) {
                console.error('⚠️ ALERTA: Este error 403 significa que OBLIGATORIAMENTE debes ir a RapidAPI y dar click en "Subscribe" al plan Free (0$). Sin eso, la llave no abre la puerta.');
            }
        } else {
            console.error(error.message);
        }
    }
}

findMatchID();
