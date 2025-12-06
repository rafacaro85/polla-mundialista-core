// src/lib/auth.ts
// Esta función redirigirá al usuario al endpoint de Google OAuth de tu API
export const signInWithGoogle = () => {
  // Asume que tu API de NestJS tiene un endpoint para iniciar el flujo de Google OAuth
  // El front-end simplemente redirige a ese endpoint. La API se encargará de la autenticación
  // con Google y de redirigir de nuevo al front-end con el token JWT.
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  console.log('🔐 Redirigiendo a Google OAuth:', `${API_URL}/auth/google`);
  window.location.href = `${API_URL}/auth/google`;
};
