import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 50 },
    { duration: '1m', target: 100 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = 'https://api.lapollavirtual.com/api';
const LEAGUE_ID = '64d78e06-88d3-4c8d-8195-abc3273e4659';

// setup() se ejecuta UNA sola vez antes de todas las iteraciones
export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'racv85@hotmail.com', password: 'Atlnacional2@' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  // Capturar la cookie auth_token del response
  const cookies = res.cookies;
  const authCookie = cookies['auth_token'] ? cookies['auth_token'][0].value : null;

  console.log(`Login status: ${res.status}`);
  console.log(`Cookie auth_token: ${authCookie ? 'SI' : 'NO'}`);

  return { authCookie };
}

export default function (data) {
  // Inyectar la cookie en cada request
  const jar = http.cookieJar();
  jar.set(BASE_URL, 'auth_token', data.authCookie);

  const res = http.get(`${BASE_URL}/leagues/${LEAGUE_ID}/ranking`);

  check(res, {
    'status 200': (r) => r.status === 200,
    'tiempo < 2s': (r) => r.timings.duration < 2000,
  });
  sleep(1);
}
