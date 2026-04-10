// src/lib/auth.ts
// Esta función redirigirá al usuario al endpoint de Google OAuth de tu API
export const signInWithGoogle = (callbackUrl?: string | null) => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  console.log('🔐 Iniciando flujo de Google OAuth');
  
  // Si no se pasa callbackUrl, usamos el origen actual (ej: https://match.lapollavirtual.com)
  const finalCallback = callbackUrl || (typeof window !== 'undefined' ? window.location.origin : null);
  
  let targetUrl = `${API_URL}/auth/google`;
  if (finalCallback) {
    targetUrl += `?redirect=${encodeURIComponent(finalCallback)}`;
  }

  console.log('🔗 Redirigiendo a:', targetUrl);
  window.location.href = targetUrl;
};
