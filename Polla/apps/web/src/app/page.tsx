'use client';
import React, { useState } from 'react';
import { DashboardClient } from '@/components/DashboardClient';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from '@/components/LandingPage';
import { useAppStore } from '@/store/useAppStore';

export default function Home() {
  const { user } = useAppStore();
  const [showLogin, setShowLogin] = useState(false);

  // Si el usuario ya está logueado o ha hecho click en "Ingresar", mostramos la App.
  // De lo contrario, mostramos la Landing Page.
  const showApp = !!user || showLogin;

  if (showApp) {
    return (
      <>
        <DashboardClient />
        <Toaster />
      </>
    );
  }

  return (
    <>
      <div className="w-full bg-red-600 text-white text-center font-bold p-4 text-xl z-50 relative">
        🚨 PRUEBA DE SEÑAL: SI LEES ESTO, EL CÓDIGO ESTÁ SUBIENDO 🚨
        <br />
        <span className="text-sm font-normal">Hora de prueba: {new Date().toLocaleTimeString()}</span>
      </div>
      <LandingPage onLoginClick={() => setShowLogin(true)} />
    </>
  );
}
