import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.APISPORTS_KEY;
const BASE_URL = 'https://v3.football.api-sports.io';

async function findLiveAndUpcoming() {
  try {
    console.log('🔍 Buscando partidos EN VIVO y próximos...\n');

    // Strategy 1: Live matches
    console.log('📡 Estrategia 1: Partidos EN VIVO ahora...\n');
    
    const liveResponse = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        live: 'all',
      },
    });

    const liveMatches = liveResponse.data.response;
    console.log(`   Partidos EN VIVO: ${liveMatches.length}\n`);

    if (liveMatches.length > 0) {
      console.log('✅ PARTIDOS EN VIVO ENCONTRADOS:\n');
      liveMatches.slice(0, 10).forEach((f: any, i: number) => {
        console.log(`${i + 1}. [ID: ${f.fixture.id}] ${f.teams.home.name} vs ${f.teams.away.name}`);
        console.log(`   Liga: ${f.league.name}`);
        console.log(`   Marcador: ${f.goals.home} - ${f.goals.away}`);
        console.log(`   Minuto: ${f.fixture.status.elapsed}'`);
        console.log(`   Estado: ${f.fixture.status.long}\n`);
      });

      if (liveMatches.length >= 2) {
        console.log('\n📋 RECOMENDACIÓN: Usa estos 2 partidos EN VIVO:\n');
        console.log(`MATCH_1_FIXTURE_ID = ${liveMatches[0].fixture.id}; // ${liveMatches[0].teams.home.name} vs ${liveMatches[0].teams.away.name}`);
        console.log(`MATCH_2_FIXTURE_ID = ${liveMatches[1].fixture.id}; // ${liveMatches[1].teams.home.name} vs ${liveMatches[1].teams.away.name}`);
      }
    }

    // Strategy 2: Upcoming matches (next 6 hours)
    console.log('\n📅 Estrategia 2: Partidos próximos (siguientes 6 horas)...\n');

    const now = new Date();
    const in6Hours = new Date(now.getTime() + 6 * 60 * 60 * 1000);

    // Get today's date in YYYY-MM-DD format
    const today = now.toISOString().split('T')[0];

    const todayResponse = await axios.get(`${BASE_URL}/fixtures`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      params: {
        date: today,
      },
    });

    const todayMatches = todayResponse.data.response;
    console.log(`   Total partidos hoy (${today}): ${todayMatches.length}\n`);

    // Filter upcoming matches in next 6 hours
    const upcomingMatches = todayMatches.filter((f: any) => {
      const matchTime = new Date(f.fixture.date);
      return matchTime > now && matchTime < in6Hours && f.fixture.status.short === 'NS';
    });

    console.log(`   Partidos próximos (1-6 horas): ${upcomingMatches.length}\n`);

    if (upcomingMatches.length > 0) {
      console.log('✅ PARTIDOS PRÓXIMOS ENCONTRADOS:\n');
      upcomingMatches.slice(0, 10).forEach((f: any, i: number) => {
        const matchTime = new Date(f.fixture.date);
        const hoursUntil = Math.round((matchTime.getTime() - now.getTime()) / (1000 * 60 * 60));
        const colombiaTime = matchTime.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        console.log(`${i + 1}. [ID: ${f.fixture.id}] ${f.teams.home.name} vs ${f.teams.away.name}`);
        console.log(`   Liga: ${f.league.name}`);
        console.log(`   Hora: ${colombiaTime} COT (en ${hoursUntil}h)`);
        console.log(`   Estadio: ${f.fixture.venue.name || 'TBD'}\n`);
      });

      if (upcomingMatches.length >= 2) {
        console.log('\n📋 RECOMENDACIÓN: Usa estos 2 partidos próximos:\n');
        console.log(`MATCH_1_FIXTURE_ID = ${upcomingMatches[0].fixture.id}; // ${upcomingMatches[0].teams.home.name} vs ${upcomingMatches[0].teams.away.name}`);
        console.log(`MATCH_2_FIXTURE_ID = ${upcomingMatches[1].fixture.id}; // ${upcomingMatches[1].teams.home.name} vs ${upcomingMatches[1].teams.away.name}`);
      }
    }

    if (liveMatches.length === 0 && upcomingMatches.length === 0) {
      console.log('\n⚠️  No hay partidos EN VIVO ni próximos en las siguientes 6 horas.');
      console.log('💡 Mostrando todos los partidos de hoy:\n');

      todayMatches.slice(0, 15).forEach((f: any, i: number) => {
        const matchTime = new Date(f.fixture.date);
        const colombiaTime = matchTime.toLocaleString('es-CO', {
          timeZone: 'America/Bogota',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        console.log(`${i + 1}. [ID: ${f.fixture.id}] ${f.teams.home.name} vs ${f.teams.away.name}`);
        console.log(`   Liga: ${f.league.name} | Hora: ${colombiaTime} COT`);
        console.log(`   Estado: ${f.fixture.status.long}\n`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
    process.exit(1);
  }
}

findLiveAndUpcoming();
