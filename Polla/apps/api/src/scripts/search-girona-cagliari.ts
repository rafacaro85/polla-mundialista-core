import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function searchGironaAndCagliari() {
  try {
    console.log('🔍 Buscando Girona vs Barcelona y Cagliari vs Lecce...\n');

    // Try multiple date strategies
    const today = new Date();
    console.log(`📅 Fecha del sistema: ${today.toISOString()}\n`);

    // Strategy 1: Try LaLiga fixtures for Girona
    console.log('🔎 Estrategia 1: Buscando en LaLiga (ID: 140)...\n');
    
    try {
      const laligaResponse = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          league: 140, // LaLiga
          season: 2023, // Try 2023-2024 season
          team: 547, // Girona team ID
        },
      });

      const gironaMatches = laligaResponse.data.response;
      console.log(`   Partidos de Girona encontrados: ${gironaMatches.length}`);

      const gironaVsBarca = gironaMatches.find((f: any) =>
        f.teams.away.name.toLowerCase().includes('barcelona') ||
        f.teams.home.name.toLowerCase().includes('barcelona')
      );

      if (gironaVsBarca) {
        console.log('\n✅ ¡Girona vs Barcelona encontrado!\n');
        const matchDate = new Date(gironaVsBarca.fixture.date);
        const colombiaTime = matchDate.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        console.log(`⚽ [ID: ${gironaVsBarca.fixture.id}]`);
        console.log(`   ${gironaVsBarca.teams.home.name} vs ${gironaVsBarca.teams.away.name}`);
        console.log(`   Liga: ${gironaVsBarca.league.name}`);
        console.log(`   Fecha: ${matchDate.toISOString().split('T')[0]}`);
        console.log(`   Hora: ${colombiaTime} (Colombia)`);
        console.log(`   Estadio: ${gironaVsBarca.fixture.venue.name}`);
        console.log(`   Estado: ${gironaVsBarca.fixture.status.long}`);
        console.log(`   Logo Local: ${gironaVsBarca.teams.home.logo}`);
        console.log(`   Logo Visitante: ${gironaVsBarca.teams.away.logo}\n`);
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }

    // Strategy 2: Try Serie A fixtures for Cagliari
    console.log('\n🔎 Estrategia 2: Buscando en Serie A (ID: 135)...\n');

    try {
      const serieaResponse = await axios.get(`${BASE_URL}/fixtures`, {
        headers: {
          'x-apisports-key': API_KEY,
        },
        params: {
          league: 135, // Serie A
          season: 2023,
          team: 488, // Cagliari team ID
        },
      });

      const cagliariMatches = serieaResponse.data.response;
      console.log(`   Partidos de Cagliari encontrados: ${cagliariMatches.length}`);

      const cagliariVsLecce = cagliariMatches.find((f: any) =>
        f.teams.away.name.toLowerCase().includes('lecce') ||
        f.teams.home.name.toLowerCase().includes('lecce')
      );

      if (cagliariVsLecce) {
        console.log('\n✅ ¡Cagliari vs Lecce encontrado!\n');
        const matchDate = new Date(cagliariVsLecce.fixture.date);
        const colombiaTime = matchDate.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        console.log(`⚽ [ID: ${cagliariVsLecce.fixture.id}]`);
        console.log(`   ${cagliariVsLecce.teams.home.name} vs ${cagliariVsLecce.teams.away.name}`);
        console.log(`   Liga: ${cagliariVsLecce.league.name}`);
        console.log(`   Fecha: ${matchDate.toISOString().split('T')[0]}`);
        console.log(`   Hora: ${colombiaTime} (Colombia)`);
        console.log(`   Estadio: ${cagliariVsLecce.fixture.venue.name}`);
        console.log(`   Estado: ${cagliariVsLecce.fixture.status.long}`);
        console.log(`   Logo Local: ${cagliariVsLecce.teams.home.logo}`);
        console.log(`   Logo Visitante: ${cagliariVsLecce.teams.away.logo}\n`);
      }
    } catch (e: any) {
      console.log(`   Error: ${e.message}`);
    }

    console.log('\n💡 Nota: Si no se encontraron, es porque estos partidos no existen en la temporada 2023-2024.');
    console.log('   Intenta buscar partidos que estén ocurriendo HOY en tiempo real.');

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

searchGironaAndCagliari();
