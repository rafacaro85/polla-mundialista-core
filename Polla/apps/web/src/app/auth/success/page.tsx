"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // La cookie auth_token ya fue seteada por el backend antes del redirect.
    // Solo necesitamos obtener el perfil del usuario (la cookie se envía automáticamente).
    const tournament = searchParams.get('tournament');
    
    if (tournament) {
      localStorage.setItem('selectedTournament', tournament);
      console.log('Torneo seleccionado guardado:', tournament);
    }

    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    console.log('🔍 [AUTH] Obteniendo perfil de usuario desde cookie...');

    // fetch con credentials para enviar la cookie httpOnly automáticamente
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

        console.log('🔍 [AUTH] Flag onboarding_business:', isBusinessOnboarding);

        if (isBusinessOnboarding) {
          console.log('🚀 [AUTH] FLAG DETECTADO - Redirigiendo a /empresa/crear');
          localStorage.removeItem(BUSINESS_ONBOARDING_KEY);
          document.cookie = `${BUSINESS_ONBOARDING_KEY}=; path=/; max-age=0`;
          window.location.href = '/empresa/crear';
        } else {
          const redirectPath = searchParams.get('redirect');
          if (redirectPath) {
            console.log(`🔀 [AUTH] Redirección personalizada: ${redirectPath}`);
            window.location.href = redirectPath;
          } else {
            // Detectar si estamos en match. para ir directo a empresas
            const isMatch = typeof window !== 'undefined' && window.location.hostname.includes('match.');
            const defaultDest = isMatch ? '/empresa/mis-pollas' : '/gateway';
            console.log(`🏠 [AUTH] Sin flag - Redirigiendo a ${defaultDest}...`);
            window.location.href = defaultDest;
          }
        }
      })
      .catch(error => {
        console.error('Error obteniendo datos del usuario:', error);
        // Si falla (cookie inválida o inexistente), ir al login
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
