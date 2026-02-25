// [REDEPLOY FORCE] v1.0.1 - Unified invitation flow
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

// Log para debuggear en producción (aparecerá en la consola del navegador)
console.log('🌍 API URL CONFIGURADA:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // CRÍTICO: envía la cookie auth_token automáticamente en cada request
});

api.interceptors.request.use(
  (config) => {
    // 1. Token: la cookie auth_token se envía automáticamente (withCredentials: true)
    // No se inyecta Authorization header manual

    // 2. Tournament Context Injection (Dynamic Header)
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const queryTournament = urlParams.get('tournament') || urlParams.get('tournamentId');
      
      if (queryTournament) {
        localStorage.setItem('selectedTournament', queryTournament);
      }

      const storedTournament = localStorage.getItem('selectedTournament');
      const hostname = window.location.hostname;
      
      // Determine default tournament based on environment context (localStorage/hostname)
      const defaultTournamentId = storedTournament || (hostname.includes('champions') ? 'UCL2526' : 'WC2026');

      // Check if the request explicitly provides a tournamentId
      if (!config.params) config.params = {};
      const explicitTournamentId = config.params.tournamentId;

      // Final Tournament ID: explicit > query > localStorage > hostname
      // If explicit param exists, use it. Otherwise use the default context.
      const targetTournamentId = explicitTournamentId || defaultTournamentId;

      // Apply to headers and params
      config.headers['X-Tournament-Id'] = targetTournamentId;
      config.params.tournamentId = targetTournamentId;
      
      if (explicitTournamentId && explicitTournamentId !== defaultTournamentId) {
        console.log(`[API] Using explicit tournamentId: ${explicitTournamentId} (ignoring context: ${defaultTournamentId})`);
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Sesión expirada (401). Redirigiendo a /login.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
