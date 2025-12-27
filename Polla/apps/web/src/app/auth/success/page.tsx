"use client";

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function SuccessLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token guardado:', token);

      // Obtener datos del usuario incluyendo el rol
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      console.log('🔍 Obteniendo perfil de usuario desde:', `${API_URL}/auth/profile`);

      fetch(`${API_URL}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
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
            // NO borrar aquí. Dejar que la página de destino lo gestione para asegurar persistencia.
            // localStorage.removeItem('pendingInviteCode'); 

            /* Use window.location.href to force full reload/redirect ensuring clean state */
            window.location.href = `/invite/${pendingInviteCode}`;
            return;
          }

          const BUSINESS_ONBOARDING_KEY = 'onboarding_business';
          const isBusinessOnboarding = getCookie(BUSINESS_ONBOARDING_KEY) || localStorage.getItem(BUSINESS_ONBOARDING_KEY);

          console.log('🔍 [AUTH] Verificando flag de onboarding...');
          console.log('🔍 [AUTH] Flag onboarding_business:', isBusinessOnboarding);

          if (isBusinessOnboarding) {
            console.log('🚀 [AUTH] FLAG DETECTADO - Redirigiendo a /business/new');
            localStorage.removeItem(BUSINESS_ONBOARDING_KEY);
            document.cookie = `${BUSINESS_ONBOARDING_KEY}=; path=/; max-age=0`;
            window.location.href = '/business/new';
          } else {
          } else {
            console.log('🏠 [AUTH] Sin flag - Verificando redirección inteligente...');

            // Smart Redirect para usuarios Enterprise
            if (userData.role !== 'SUPER_ADMIN') {
              fetch(`${API_URL}/leagues/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
              })
                .then(res => res.json())
                .then(leagues => {
                  // Filtrar ligas empresariales
                  const enterpriseLeagues = leagues.filter((l: any) => l.type === 'COMPANY' || l.isEnterprise);

                  // Si tiene exactamente una liga y es empresarial -> Redirect directo
                  if (leagues.length === 1 && enterpriseLeagues.length === 1) {
                    console.log('🚀 [AUTH] Redirigiendo a Liga Empresarial:', enterpriseLeagues[0].id);
                    window.location.href = `/leagues/${enterpriseLeagues[0].id}`;
                  } else {
                    window.location.href = '/dashboard';
                  }
                })
                .catch(err => {
                  console.error('Error fetching leagues:', err);
                  window.location.href = '/dashboard';
                });
            } else {
              window.location.href = '/dashboard';
            }
          }
        })
        .catch(error => {
          console.error('Error obteniendo datos del usuario:', error);
          // Aún así redirigir al dashboard
          window.location.href = '/dashboard';
        });
    } else {
      console.error('No se encontró el token en la URL.');
      router.push('/login'); // Redirige al login si no hay token
    }
  }, [router, searchParams]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white p-4">
      <h1 className="text-3xl font-bold mb-4">Autenticación Exitosa</h1>
      <p>Redirigiendo al dashboard...</p>
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
