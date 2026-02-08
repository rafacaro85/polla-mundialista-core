'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Trophy, 
  Users, 
  Zap, 
  Building2, 
  CheckCircle, 
  ArrowRight, 
  Play, 
  BarChart3, 
  Settings,
  ShieldCheck,
  Sparkles,
  Rocket
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function DemoLandingPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleStartDemo = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/demo/start');
      
      // Almacenar credenciales del demo
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success('¡Entorno Demo inicializado con éxito!');
      
      // Redirigir a la liga demo
      router.push(`/leagues/${data.leagueId}/predictions`);
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar el demo. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white selection:bg-[#00E676] selection:text-[#0F172A] overflow-hidden flex flex-col">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&display=swap');
        .font-russo { font-family: 'Russo One', sans-serif; }
      `}</style>

      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#00E676] rounded-full blur-[150px] opacity-10 -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-600 rounded-full blur-[150px] opacity-10 translate-y-1/2 -translate-x-1/4"></div>

      <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#00E676]/10 border border-[#00E676]/30 rounded-full text-[#00E676] text-xs font-bold uppercase tracking-[0.2em] mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Sparkles size={14} /> Sandbox Empresarial
        </div>

        <h1 className="font-russo text-5xl md:text-7xl lg:text-8xl mb-8 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-700">
          PRUEBA EL <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-emerald-400">DEMO MUNDIAL</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-900">
            Vive la experiencia completa de <strong>La Polla Virtual</strong> en un entorno seguro. 
            Simula partidos, gestiona usuarios y personaliza tu marca en segundos.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
            <DemoFeature 
                icon={<Building2 className="text-[#00E676]" />} 
                title="Personalización" 
                desc="Ajusta colores y logos de tu empresa." 
            />
            <DemoFeature 
                icon={<Zap className="text-[#00E676]" />} 
                title="Simulación IA" 
                desc="Avanza el mundial y ve los puntos volar." 
            />
            <DemoFeature 
                icon={<BarChart3 className="text-[#00E676]" />} 
                title="Ranking Pro" 
                desc="Estadísticas detalladas por departamentos." 
            />
        </div>

        <button 
          onClick={handleStartDemo}
          disabled={loading}
          className="group relative bg-[#00E676] text-[#0F172A] font-black text-xl px-12 py-6 rounded-2xl shadow-[0_0_50px_rgba(0,230,118,0.3)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100"
        >
          {loading ? (
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-4 border-[#0F172A]/20 border-t-[#0F172A] rounded-full animate-spin"></div>
              INICIALIZANDO...
            </div>
          ) : (
            <div className="flex items-center gap-3">
              EMPEZAR DEMO <ArrowRight className="group-hover:translate-x-2 transition-transform" strokeWidth={3} />
            </div>
          )}
          <div className="absolute inset-0 rounded-2xl border-4 border-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
        </button>

        <div className="mt-20 flex items-center justify-center gap-10 text-slate-500">
            <div className="flex flex-col items-center gap-2">
                <ShieldCheck size={32} />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00E676]">Sandbox Seguro</span>
            </div>
            <div className="w-px h-10 bg-slate-800"></div>
            <div className="flex flex-col items-center gap-2">
                <Rocket size={32} />
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#00E676]">Listo en 3 Segundos</span>
            </div>
        </div>
      </main>

      <footer className="py-10 text-center text-slate-600 text-sm border-t border-slate-900 z-10">
        © 2026 La Polla Virtual • Enterprise Edition
      </footer>
    </div>
  );
}

function DemoFeature({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div className="bg-[#1E293B]/50 backdrop-blur-sm border border-slate-800 p-6 rounded-2xl text-left hover:border-[#00E676]/50 transition-colors group">
            <div className="mb-4 w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">{icon}</div>
            <h3 className="font-bold text-lg mb-2">{title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
        </div>
    );
}
