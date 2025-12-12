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

  return <LandingPage onLoginClick={() => setShowLogin(true)} />;
}
