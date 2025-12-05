import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
      console.log('Enviando Token:', token);
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
      localStorage.removeItem('token');
      console.log('Token eliminado debido a 401. Redirigiendo a /login.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { api };
export default api;
