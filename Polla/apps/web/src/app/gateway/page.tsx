"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Users, Building2, ChevronRight, Trophy, Zap } from 'lucide-react';

/* =============================================================================
   COMPONENTE: SELECTOR DE EXPERIENCIA (GATEWAY)
   ============================================================================= */
export default function GatewayApp() {
  const router = useRouter();

  React.useEffect(() => {
    // 1. Check for invitations first
    const inviteCode = localStorage.getItem('pendingInviteCode');
    if (inviteCode) {
      window.location.href = `/invite/${inviteCode}`;
      return;
    }

    // 2. Si estamos en match. automático a empresas
    if (typeof window !== 'undefined' && window.location.hostname.includes('match.')) {
      window.location.href = '/empresa/mis-pollas';
    }
  }, []);

  const STYLES = {
    container: "min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-6 relative overflow-hidden",
    glow: "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,230,118,0.05)_0%,transparent_70%)] pointer-events-none",
    card: "group relative bg-[#1E293B]/80 backdrop-blur-xl border border-[#334155] hover:border-[#00E676] rounded-[32px] p-8 transition-all duration-500 cursor-pointer flex flex-col items-center text-center overflow-hidden w-full max-w-[320px]",
    cardGlow: "absolute inset-0 bg-gradient-to-br from-[#00E676]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity",
    iconBox: "w-20 h-20 rounded-2xl flex items-center justify-center mb-6 relative z-10",
    title: "text-2xl font-russo text-white uppercase mb-3 relative z-10",
    desc: "text-[#94A3B8] text-sm leading-relaxed mb-8 relative z-10",
    badge: "absolute top-4 right-4 bg-[#00E676] text-[#0F172A] text-[10px] font-black px-3 py-1 rounded-full z-20 shadow-[0_0_15px_rgba(0,230,118,0.3)]",
  };

  return (
    <div className={STYLES.container}>
      <div className={STYLES.glow} />
      
      <div className="text-center mb-12 relative z-10">
        <h1 className="text-4xl md:text-5xl font-russo text-white uppercase tracking-tighter">
          BIENVENIDO A LA <span className="text-[#00E676]">POLLA</span>
        </h1>
        <p className="text-[#94A3B8] font-bold uppercase tracking-widest text-xs mt-2">Selecciona tu campo de juego</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 relative z-10 w-full justify-center items-stretch">
        
        {/* EXPERIENCIA SOCIAL */}
        <div 
          onClick={() => window.location.href = '/social/mis-pollas'}
          className={STYLES.card}
        >
          <div className={STYLES.cardGlow} />
          <div className={`${STYLES.iconBox} bg-blue-500/10 text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all`}>
            <Users size={40} />
          </div>
          <h2 className={STYLES.title}>Social</h2>
          <p className={STYLES.desc}>
            Para jugar con tus amigos, familiares y parches. Crea tu liga y compite por el honor.
          </p>
          <div className="mt-auto flex items-center gap-2 text-[#00E676] font-black uppercase text-xs">
            Entrar al Hub <ChevronRight size={16} />
          </div>
        </div>

        {/* EXPERIENCIA EMPRESARIAL / MATCH */}
        <div 
          onClick={() => window.location.href = '/empresa/mis-pollas'}
          className={STYLES.card}
        >
          <div className={STYLES.badge}>PREMIUM</div>
          <div className={STYLES.cardGlow} />
          <div className={`${STYLES.iconBox} bg-emerald-500/10 text-[#00E676] group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all`}>
            <Building2 size={40} />
          </div>
          <h2 className={STYLES.title}>Corporativo</h2>
          <p className={STYLES.desc}>
             Soluciones para empresas, bares e influencers. Branding personalizado y gestión masiva.
          </p>
          <div className="mt-auto flex items-center gap-2 text-[#00E676] font-black uppercase text-xs">
            Panel de Gestión <ChevronRight size={16} />
          </div>
        </div>

      </div>

      <div className="mt-16 text-[#475569] text-[10px] font-bold uppercase tracking-[0.3em] flex items-center gap-4">
        <div className="w-12 h-px bg-[#334155]" />
        LA POLLA VIRTUAL • 2026 
        <div className="w-12 h-px bg-[#334155]" />
      </div>
    </div>
  );
}
