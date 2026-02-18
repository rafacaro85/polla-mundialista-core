"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Trophy, 
  Users, 
  Target, 
  ArrowRight, 
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  // BRANDING CONFIG
  const BRAND = {
    logo: process.env.NEXT_PUBLIC_COMPANY_LOGO,
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '#00E676', // Default Signal Green
    heroImage: process.env.NEXT_PUBLIC_HERO_IMAGE || "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?q=80&w=2831&auto=format&fit=crop",
    companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'POLLA MUNDIALISTA'
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white font-sans overflow-x-hidden selection:bg-emerald-500/30">
      
      {/* NAVBAR */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-[#0F172A]/90 backdrop-blur-md shadow-lg py-4" : "bg-transparent py-6"}`}>
        <div className="container mx-auto px-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {BRAND.logo ? (
                 <img src={BRAND.logo} alt="Logo" className="h-10 w-auto object-contain" />
            ) : (
                <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/10">
                    <Trophy className="text-emerald-400" size={24} />
                </div>
            )}
            
            {!BRAND.logo && (
                <span className="text-2xl font-[900] tracking-tighter italic">
                    {BRAND.companyName.split(' ')[0]} <span style={{ color: BRAND.primaryColor }}>{BRAND.companyName.split(' ').slice(1).join(' ')}</span>
                </span>
            )}
          </div>
          
          <button 
            onClick={() => router.push('/login')}
            className="px-6 py-2.5 bg-white text-slate-900 rounded-full font-bold text-sm tracking-wide hover:bg-emerald-50 transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            INGRESAR
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/60 to-[#0F172A] z-10" />
          <img 
            src={BRAND.heroImage}
            alt="Hero Background" 
            className="w-full h-full object-cover opacity-60"
          />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Plataforma Corporativa</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-[900] leading-tight mb-8 tracking-tight drop-shadow-2xl">
            VIVE LA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              PASIÓN DEL MUNDIAL
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
            La plataforma oficial para vivir la emoción de la Copa Mundial 2026. 
            Predice resultados, compite con tus compañeros y gana.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => router.push('/login')}
              style={{ backgroundColor: BRAND.primaryColor, boxShadow: `0 0 40px ${BRAND.primaryColor}40` }}
              className="group relative px-8 py-5 text-slate-900 rounded-2xl font-[800] text-lg tracking-wide overflow-hidden transition-all hover:scale-105"
            >
              <span className="relative z-10 flex items-center gap-3">
                JUGAR AHORA <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* FEATURES GRID (SIMPLIFIED) */}
      <section className="py-32 relative bg-[#0F172A]">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Trophy size={32} className="text-yellow-400" />}
              title="Torneo Oficial"
              desc="Participa en la polla oficial de la empresa y demuestra tus conocimientos."
            />
            <FeatureCard 
              icon={<Users size={32} className="text-blue-400" />}
              title="Compite con Amigos"
              desc="Sigue el ranking en vivo y vive la rivalidad amistosa con tus colegas."
            />
            <FeatureCard 
              icon={<Target size={32} className="text-emerald-400" />}
              title="Predicciones en Vivo"
              desc="Realiza tus pronósticos hasta minutos antes de cada partido."
            />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-800 bg-[#0B1120] py-12 relative overflow-hidden">
        <div className="container mx-auto px-6 relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all">
             {BRAND.logo ? (
                 <img src={BRAND.logo} alt="Logo Footer" className="h-8 opacity-80" />
            ) : (
                <span className="text-xl font-[900] tracking-tighter italic text-white">
                    POLLA <span style={{ color: BRAND.primaryColor }}>MUNDIALISTA</span>
                </span>
            )}
          </div>
          <p className="text-slate-500 text-sm">
            © 2026 {BRAND.companyName}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="group bg-slate-800/30 border border-slate-700/50 p-8 rounded-3xl hover:bg-slate-800/50 transition-all duration-500 hover:border-slate-600">
      <div className="mb-6 p-4 rounded-2xl bg-white/5 w-fit group-hover:scale-110 transition-transform duration-500 border border-white/5">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-emerald-400 transition-colors">
        {title}
      </h3>
      <p className="text-slate-400 leading-relaxed">
        {desc}
      </p>
    </div>
  )
}