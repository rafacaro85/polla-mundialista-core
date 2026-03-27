import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 1000 },  // pico repentino
    { duration: '2m', target: 1000 },   // mantener pico
    { duration: '30s', target: 0 },     // bajar
  ],
  thresholds: {
    http_req_duration: ['p(95)<5000'],
    http_req_failed: ['rate<0.15'],
  },
};

const BASE_URL = 'https://api.lapollavirtual.com/api';

export function setup() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: 'racv85@hotmail.com', password: 'Atlnacional2@' }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const cookies = res.cookies;
  const authCookie = cookies['auth_token'] ? cookies['auth_token'][0].value : null;

  console.log(`Login status: ${res.status}`);
  console.log(`Cookie auth_token: ${authCookie ? 'SI' : 'NO'}`);

  return { authCookie };
}

export default function (data) {
  const jar = http.cookieJar();
  jar.set(BASE_URL, 'auth_token', data.authCookie);

  const res = http.get(`${BASE_URL}/matches/live?tournamentId=WC2026`);

  check(res, {
    'status 200': (r) => r.status === 200,
    'tiempo < 5s': (r) => r.timings.duration < 5000,
  });
  sleep(1);
}
