import http from 'k6/http';
import { check, sleep } from 'k6';
import { randomIntBetween } from 'https://jslib.k6.io/k6-utils/1.4.0/index.js';

// ==============================================================================
// CONFIGURACIÓN
// ==============================================================================

// Token proporcionado (asegúrate de que sea válido/reciente)
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InJhY3Y4NUBnbWFpbC5jb20iLCJzdWIiOiIzZjczZGEwZi0wOGVjLTRmYTEtOGZkNS03OWRmNzBmNmViNjciLCJpYXQiOjE3Njg5NjIwMTQsImV4cCI6MTc2OTA0ODQxNH0.CiSFeGblMz9P5CgeS1rc8-fwuzJAUZOpMPRLykgh0M8';

// Probamos a través del dominio público por si hay temas de cookies/proxy
const BASE_URL = 'https://lapollavirtual.com/api';  

const HEADERS = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
    'Origin': 'https://lapollavirtual.com', 
    'User-Agent': 'k6-stress-test-bot/1.0',
};

// ==============================================================================
// OPCIONES (SCENARIOS)
// ==============================================================================

export const options = {
  scenarios: {
    submit_predictions: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 700 }, // 700 usuarios
        { duration: '2m', target: 700 }, 
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'submitPrediction',
    },
    compute_heavy: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 300 }, // 300 usuarios
        { duration: '2m', target: 300 },
        { duration: '30s', target: 0 },
      ],
      gracefulRampDown: '10s',
      exec: 'requestCompute',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'], 
    http_req_duration: ['p(95)<2000'], 
  },
};

// ==============================================================================
// SETUP: OBTENER MATCH ID DINÁMICAMENTE
// ==============================================================================
export function setup() {
  console.log(`🔍 Buscando un Match ID válido en ${BASE_URL}/matches/live...`);
  
  const res = http.get(`${BASE_URL}/matches/live`, { headers: HEADERS });
  
  if (res.status !== 200) {
    console.error(`❌ Error en SETUP: No se pudo obtener partidos. Status: ${res.status}`);
    console.error(`Respuesta: ${res.body}`);
    throw new Error('Fallo crítico en Setup: Verifica que el Token sea válido.');
  }

  const matches = res.json();
  if (!matches || matches.length === 0) {
    throw new Error('❌ No hay partidos en vivo/pendientes disponibles para probar.');
  }

  const matchId = matches[0].id;
  console.log(`✅ SETUP ÉXITOSO. Usando Match ID: ${matchId}`);
  console.log(`   Partido: ${matches[0].homeTeam} vs ${matches[0].awayTeam}`);
  
  return { matchId: matchId }; // Estos datos se pasan a las funciones default
}

// ==============================================================================
// FUNCIONES DE CARGA
// ==============================================================================

export function submitPrediction(data) {
  const matchId = data.matchId; // Obtenido del setup()

  const payload = JSON.stringify({
    matchId: matchId,
    homeScore: randomIntBetween(0, 5),
    awayScore: randomIntBetween(0, 5),
    isJoker: false,
  });

  const res = http.post(`${BASE_URL}/predictions`, payload, { headers: HEADERS });

  check(res, {
    'Crea Predicción (200/201)': (r) => r.status === 201 || r.status === 200,
  });

  sleep(randomIntBetween(1, 3));
}

export function requestCompute() {
  const res = http.get(`${BASE_URL}/standings/all`, { headers: HEADERS });

  check(res, {
    'Lee Tabla (200)': (r) => r.status === 200,
    'Tiene Datos': (r) => r.body && r.body.length > 50,
  });

  sleep(randomIntBetween(2, 5));
}

