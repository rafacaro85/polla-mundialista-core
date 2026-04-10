"use client";

import React from 'react';
import { useRouter } from 'next/navigation';

export default function GatewayApp() {
  React.useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const code = getCookie('pendingInviteCode') || localStorage.getItem('pendingInviteCode');
    if (code) {
      console.log('🚀 [Gateway] Pending Invite Found. Redirecting to invite processor:', code);
      window.location.href = `/invite/${code}`;
      return;
    }

    // Redirect directly to enterprise dashboard (Polla Match module)
    window.location.href = '/empresa/mis-pollas';
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-[#00E676] border-t-transparent flex items-center justify-center rounded-full animate-spin"></div>
      <p className="mt-4 text-[#00E676] font-russo animate-pulse">Cargando...</p>
    </div>
  );
}
