// src/lib/auth.ts
// Esta función redirigirá al usuario al endpoint de Google OAuth de tu API
export const signInWithGoogle = (callbackUrl?: string | null) => {
  // Asume que tu API de NestJS tiene un endpoint para iniciar el flujo de Google OAuth
  // El front-end simplemente redirige a ese endpoint. La API se encargará de la autenticación
  // con Google y de redirigir de nuevo al front-end con el token JWT.
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  console.log('🔐 Iniciando flujo de Google OAuth');
  
  let targetUrl = `${API_URL}/auth/google`;
  if (callbackUrl) {
    targetUrl += `?redirect=${encodeURIComponent(callbackUrl)}`;
  }

  console.log('🔗 Redirigiendo a:', targetUrl);
  window.location.href = targetUrl;
};
