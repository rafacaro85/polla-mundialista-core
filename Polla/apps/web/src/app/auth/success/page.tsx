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
      fetch('http://localhost:3000/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(userData => {
          console.log('Datos del usuario obtenidos:', userData);
          localStorage.setItem('user', JSON.stringify(userData));
          // Importante: forzar recarga completa para asegurar que el dashboard lea el localStorage fresco
          window.location.href = '/';
        })
        .catch(error => {
          console.error('Error obteniendo datos del usuario:', error);
          // Aún así redirigir, el dashboard intentará obtener los datos
          window.location.href = '/';
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
