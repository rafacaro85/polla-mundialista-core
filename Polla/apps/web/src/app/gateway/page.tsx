"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, Users, Trophy, 
  Hexagon, Plus, LogIn,
} from 'lucide-react';

import { PromoBanner } from '@/components/PromoBanner';

export default function GatewayApp() {
  const router = useRouter();

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
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-[#F8FAFC] font-sans selection:bg-[#00E676] selection:text-[#0F172A] flex flex-col overflow-x-hidden">
      
      {/* ====================================================================
          ESTILOS GLOBALES (Animaciones y Scrollbar)
          ==================================================================== */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}} />

      {/* Glow Effects de Fondo */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
        <div className="absolute top-[-10%] left-[5%] w-[50vw] h-[50vw] bg-[#00E676] rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-blue-600 rounded-full mix-blend-screen filter blur-[150px] opacity-10"></div>
      </div>

      {/* ====================================================================
          1. NAVBAR (Ultra Clean)
          ==================================================================== */}
      <nav className="relative z-50 px-6 py-6 flex justify-center items-center w-full shrink-0">
        <div className="flex flex-col items-center gap-4">
          <img 
            src="/images/lpv/lpv-full-logo.png" 
            alt="La Polla Virtual" 
            className="h-20 md:h-32 w-auto object-contain drop-shadow-[0_0_20px_rgba(0,230,118,0.2)]"
          />
          <span className="text-white font-russo text-xl md:text-2xl tracking-[0.3em] uppercase opacity-90">
            La Polla Virtual
          </span>
        </div>
      </nav>

      {/* ====================================================================
          2. GATEWAY SECTION (El Filtro Principal)
          ==================================================================== */}
      <section className="relative z-10 flex flex-col items-center justify-center py-12 px-6 shrink-0">

        <div className="flex flex-col md:flex-row gap-6 md:gap-8 w-full max-w-5xl mx-auto">
          
          {/* Card: POLLA SOCIAL */}
          <div className="group relative min-h-[320px] md:min-h-[380px] rounded-[2.5rem] md:rounded-[3rem] bg-[#1E293B] border-2 border-slate-800 hover:border-[#00E676]/50 transition-all duration-500 overflow-hidden flex flex-col items-center justify-center p-8 gap-6 flex-1 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-t from-[#00E676]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-[#0F172A] border border-slate-700 flex items-center justify-center group-hover:scale-110 group-hover:border-[#00E676] group-hover:text-[#00E676] transition-all duration-500">
              <Users className="w-8 h-8 md:w-10 md:h-10" />
            </div>

            <div className="text-center relative z-10">
                <h2 className="text-2xl md:text-4xl font-russo text-white tracking-tight mb-2 uppercase text-center">
                Polla Social
                </h2>
                <p className="text-slate-500 text-xs md:text-sm font-medium">Juega con amigos y familia</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full relative z-10 mt-2">
                <Link href="/social/mis-pollas?create=true" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-[#00E676] hover:text-[#050505] transition-all duration-300 group/btn shadow-lg">
                    <Plus size={20} className="group-hover/btn:scale-125 transition-transform" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Crear</span>
                </Link>
                <Link href="/social/mis-pollas" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-white/5 border border-white/5 hover:bg-slate-200 hover:text-[#050505] transition-all duration-300 group/btn shadow-lg">
                    <LogIn size={20} className="group-hover/btn:scale-125 transition-transform" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Ingresar</span>
                </Link>
            </div>
          </div>

          {/* Card: POLLA EMPRESARIAL */}
          <div className="group relative min-h-[320px] md:min-h-[380px] rounded-[2.5rem] md:rounded-[3rem] bg-[#00E676] transition-all duration-500 overflow-hidden flex flex-col items-center justify-center p-8 gap-6 flex-1 shadow-[0_0_50px_rgba(0,230,118,0.2)]">
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 w-16 h-16 md:w-20 md:h-20 rounded-full bg-black/10 flex items-center justify-center group-hover:scale-110 transition-all duration-500 text-[#050505]">
              <Building2 className="w-8 h-8 md:w-10 md:h-10" />
            </div>

            <div className="text-center relative z-10">
                <h2 className="text-2xl md:text-4xl font-russo text-[#0F172A] tracking-tight mb-2 uppercase">
                Polla Empresarial
                </h2>
                <p className="text-[#050505]/60 text-xs md:text-sm font-bold uppercase tracking-tighter">Engagement Corporativo</p>
            </div>

            <div className="grid grid-cols-2 gap-3 w-full relative z-10 mt-2">
                <Link href="/empresa/crear" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-black/10 hover:bg-black hover:text-[#00E676] text-[#050505] transition-all duration-300 group/btn shadow-lg">
                    <Plus size={20} className="group-hover/btn:scale-125 transition-transform" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Crear</span>
                </Link>
                <Link href="/empresa/mis-pollas" className="flex flex-col items-center justify-center gap-2 p-4 rounded-3xl bg-black/10 hover:bg-slate-900 hover:text-white text-[#050505] transition-all duration-300 group/btn shadow-lg">
                    <LogIn size={20} className="group-hover/btn:scale-125 transition-transform" />
                    <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">Ingresar</span>
                </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ====================================================================
          3. PROMO BANNER (Tarjetas Motivacionales)
          ==================================================================== */}
      <PromoBanner
        onActionSocial={() => router.push('/social/mis-pollas?create=true')}
        onActionEnterprise={() => router.push('/empresa/crear')}
      />



      {/* ====================================================================
          5. FOOTER MARQUEE (Países Participantes)
          ==================================================================== */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0F172A] py-14 overflow-hidden shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#0F172A] via-[#0F172A]/80 to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0F172A] via-[#0F172A]/80 to-transparent z-20 pointer-events-none"></div>
        
        <p className="text-center text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-slate-500 mb-10 opacity-70">
          PAÍSES PARTICIPANTES — TORNEOS GLOBALES
        </p>
        
        <div className="flex w-[200%] animate-marquee opacity-40 hover:opacity-100 grayscale hover:grayscale-0 transition-all duration-700 ease-in-out">
          <div className="flex w-1/2 justify-around items-center">
            {[
              { iso: 'ar', name: 'Argentina' },
              { iso: 'br', name: 'Brasil' },
              { iso: 'mx', name: 'México' },
              { iso: 'us', name: 'USA' },
              { iso: 'ca', name: 'Canadá' },
              { iso: 'fr', name: 'Francia' },
              { iso: 'es', name: 'España' },
              { iso: 'de', name: 'Alemania' },
              { iso: 'co', name: 'Colombia' },
              { iso: 'uy', name: 'Uruguay' },
              { iso: 'gb-eng', name: 'Inglaterra' },
              { iso: 'it', name: 'Italia' },
              { iso: 'pt', name: 'Portugal' },
              { iso: 'nl', name: 'Países Bajos' },
              { iso: 'be', name: 'Bélgica' },
              { iso: 'hr', name: 'Croacia' },
              { iso: 'jp', name: 'Japón' },
              { iso: 'ma', name: 'Marruecos' },
              { iso: 'ec', name: 'Ecuador' },
              { iso: 'cl', name: 'Chile' }
            ].map((country, idx) => (
              <div key={`flag-1-${idx}`} className="flex flex-col items-center gap-3 px-8 group/flag">
                <div className="relative">
                  <div className="absolute -inset-1 bg-white/10 rounded-lg blur opacity-0 group-hover/flag:opacity-100 transition duration-500"></div>
                  <img 
                    src={`/assets/flags/${country.iso}.svg`} 
                    alt={country.name}
                    className="relative w-12 h-8 md:w-16 md:h-11 object-cover rounded-md shadow-2xl border border-white/10 group-hover/flag:scale-110 group-hover/flag:border-[#00E676]/30 transition-all duration-500"
                  />
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover/flag:text-[#00E676] transition-colors duration-500">
                  {country.name}
                </span>
              </div>
            ))}
          </div>
          <div className="flex w-1/2 justify-around items-center">
            {[
              { iso: 'ar', name: 'Argentina' },
              { iso: 'br', name: 'Brasil' },
              { iso: 'mx', name: 'México' },
              { iso: 'us', name: 'USA' },
              { iso: 'ca', name: 'Canadá' },
              { iso: 'fr', name: 'Francia' },
              { iso: 'es', name: 'España' },
              { iso: 'de', name: 'Alemania' },
              { iso: 'co', name: 'Colombia' },
              { iso: 'uy', name: 'Uruguay' },
              { iso: 'gb-eng', name: 'Inglaterra' },
              { iso: 'it', name: 'Italia' },
              { iso: 'pt', name: 'Portugal' },
              { iso: 'nl', name: 'Países Bajos' },
              { iso: 'be', name: 'Bélgica' },
              { iso: 'hr', name: 'Croacia' },
              { iso: 'jp', name: 'Japón' },
              { iso: 'ma', name: 'Marruecos' },
              { iso: 'ec', name: 'Ecuador' },
              { iso: 'cl', name: 'Chile' }
            ].map((country, idx) => (
              <div key={`flag-2-${idx}`} className="flex flex-col items-center gap-3 px-8 group/flag">
                <div className="relative">
                  <div className="absolute -inset-1 bg-white/10 rounded-lg blur opacity-0 group-hover/flag:opacity-100 transition duration-500"></div>
                  <img 
                    src={`/assets/flags/${country.iso}.svg`} 
                    alt={country.name}
                    className="relative w-12 h-8 md:w-16 md:h-11 object-cover rounded-md shadow-2xl border border-white/10 group-hover/flag:scale-110 group-hover/flag:border-[#00E676]/30 transition-all duration-500"
                  />
                </div>
                <span className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase tracking-tighter group-hover/flag:text-[#00E676] transition-colors duration-500">
                  {country.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </footer>

    </div>
  );
}
