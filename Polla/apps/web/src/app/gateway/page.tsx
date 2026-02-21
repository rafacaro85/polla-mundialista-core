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
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 md:w-10 md:h-10">
            <Hexagon className="absolute inset-0 text-[#00E676]" size="100%" strokeWidth={1.5} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 md:w-3 md:h-3 bg-[#00E676] rounded-full shadow-[0_0_15px_#00E676] animate-pulse"></div>
            </div>
          </div>
          <span className="text-white font-russo text-xl md:text-2xl tracking-tighter uppercase">LA POLLA VIRTUAL</span>
        </div>
      </nav>

      {/* ====================================================================
          2. GATEWAY SECTION (El Filtro Principal)
          ==================================================================== */}
      <section className="relative z-10 flex flex-col items-center justify-center py-12 px-6 shrink-0">
        <h1 className="text-3xl md:text-6xl font-russo text-white tracking-tight mb-10 text-center uppercase">
          Elige dónde jugar...
        </h1>

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
          5. FOOTER MARQUEE (Empresas)
          ==================================================================== */}
      <footer className="relative z-10 border-t border-white/5 bg-[#0F172A] py-10 overflow-hidden shrink-0">
        <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#0F172A] to-transparent z-20 pointer-events-none"></div>
        <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#0F172A] to-transparent z-20 pointer-events-none"></div>
        
        <p className="text-center text-[9px] font-black uppercase tracking-[0.3em] text-slate-600 mb-6">
          PLATAFORMA RESPALDADA POR EMPRESAS LÍDERES
        </p>
        
        <div className="flex w-[200%] animate-marquee opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex w-1/2 justify-around items-center">
            <span className="text-xl md:text-2xl font-black flex items-center gap-2 px-8"><Hexagon size={24}/> META</span>
            <span className="text-xl md:text-2xl font-black font-serif px-8">Deloitte.</span>
            <span className="text-xl md:text-2xl font-black tracking-tighter px-8">CBRE</span>
            <span className="text-xl md:text-2xl font-black px-8">AMGEN</span>
            <span className="text-xl md:text-2xl font-black italic px-8">Paychex</span>
            <span className="text-xl md:text-2xl font-black uppercase px-8 text-blue-500">Sony</span>
          </div>
          <div className="flex w-1/2 justify-around items-center">
            <span className="text-xl md:text-2xl font-black flex items-center gap-2 px-8"><Hexagon size={24}/> META</span>
            <span className="text-xl md:text-2xl font-black font-serif px-8">Deloitte.</span>
            <span className="text-xl md:text-2xl font-black tracking-tighter px-8">CBRE</span>
            <span className="text-xl md:text-2xl font-black px-8">AMGEN</span>
            <span className="text-xl md:text-2xl font-black italic px-8">Paychex</span>
            <span className="text-xl md:text-2xl font-black uppercase px-8 text-blue-500">Sony</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
