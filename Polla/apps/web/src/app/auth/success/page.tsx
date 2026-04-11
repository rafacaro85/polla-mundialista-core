"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tournament = searchParams.get('tournament');
    if (tournament) {
      localStorage.setItem('selectedTournament', tournament);
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL;

    // --- PASO 1: Obtener el token ---
    // Prioridad: token en URL (Google OAuth cross-domain) > cookie existente
    const tokenFromUrl = searchParams.get('token');
    
    if (tokenFromUrl) {
      console.log('🔑 [AUTH] Token recibido en URL (Google OAuth). Seteando cookie en dominio local...');
      // Setear la cookie en el dominio del FRONTEND (match.lapollavirtual.com)
      // Esto resuelve el problema de cookies cross-domain con Chrome 120+
      document.cookie = `auth_token=${tokenFromUrl}; path=/; secure; samesite=none; max-age=86400`;
      
      // Limpiar el token de la URL para no dejarlo expuesto en el historial
      window.history.replaceState({}, '', '/auth/success');
    }

    console.log('🔍 [AUTH] Obteniendo perfil de usuario...');

    // --- PASO 2: Llamar /auth/profile con la cookie ---
    fetch(`${API_URL}/auth/profile`, { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(userData => {
        console.log('✅ [AUTH] Datos del usuario obtenidos:', userData);
        localStorage.setItem('user', JSON.stringify(userData));

        const getCookie = (name: string) => {
          const value = `; ${document.cookie}`;
          const parts = value.split(`; ${name}=`);
          if (parts.length === 2) return parts.pop()?.split(';').shift();
          return null;
        };

        const pendingInviteCode = getCookie('pendingInviteCode') || localStorage.getItem('pendingInviteCode');
        
        if (pendingInviteCode) {
          console.log('🎟️ [AUTH] Invitación pendiente detectada:', pendingInviteCode);
          localStorage.setItem('pendingInviteCode', pendingInviteCode);
          window.location.href = `/invite/${pendingInviteCode}`;
          return;
        }

        const BUSINESS_ONBOARDING_KEY = 'onboarding_business';
        const isBusinessOnboarding = getCookie(BUSINESS_ONBOARDING_KEY) || localStorage.getItem(BUSINESS_ONBOARDING_KEY);

        if (isBusinessOnboarding) {
          console.log('🚀 [AUTH] FLAG DETECTADO - Redirigiendo a /empresa/crear');
          localStorage.removeItem(BUSINESS_ONBOARDING_KEY);
          document.cookie = `${BUSINESS_ONBOARDING_KEY}=; path=/; max-age=0`;
          window.location.href = '/empresa/crear';
        } else {
          const redirectPath = searchParams.get('redirect');
          if (redirectPath) {
            window.location.href = redirectPath;
          } else {
            const isMatch = typeof window !== 'undefined' && window.location.hostname.includes('match.');
            const defaultDest = isMatch ? '/empresa/mis-pollas' : '/gateway';
            console.log(`🏠 [AUTH] Redirigiendo a ${defaultDest}...`);
            window.location.href = defaultDest;
          }
        }
      })
      .catch(error => {
        console.error('❌ [AUTH] Error obteniendo perfil:', error);
        router.push('/login');
      });
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Autenticación Exitosa</h1>
      <p>Redirigiendo...</p>
    </div>
  );
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div>Procesando...</div>}>
      <SuccessLogic />
    </Suspense>
  );
}
