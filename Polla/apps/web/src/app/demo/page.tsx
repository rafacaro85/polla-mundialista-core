'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  Zap, 
  BarChart3, 
  ShieldCheck,
  Sparkles,
  Rocket,
  ArrowRight,
  Heart,
  Gift,
  TrendingUp
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

type DemoType = 'enterprise' | 'social';

export default function DemoLandingPage() {
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<DemoType | null>(null);
  const router = useRouter();

  const handleStartDemo = async (type: DemoType) => {
    setLoading(true);
    setSelectedDemo(type);
    try {
      const endpoint = type === 'enterprise' ? '/demo/start/enterprise' : '/demo/start/social';
      const { data } = await api.post(endpoint);
      
      // El endpoint de demo setea la cookie auth_token en el servidor
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success(`¡Demo ${type === 'enterprise' ? 'Empresarial' : 'Social'} inicializado!`);
      
      // Redirigir al Hub/Dashboard de la liga demo
      router.push(`/leagues/${data.leagueId}`);
    } catch (error) {
      console.error(error);
      toast.error('Error al iniciar el demo. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
      setSelectedDemo(null);
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
          <Sparkles size={14} /> Prueba sin Compromiso
        </div>

        <h1 className="font-russo text-5xl md:text-7xl lg:text-8xl mb-8 leading-[0.9] tracking-tighter animate-in fade-in slide-in-from-bottom-6 duration-700">
          ELIGE TU <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-emerald-400">DEMO MUNDIAL</span>
        </h1>

        <p className="text-slate-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-900">
            Vive la experiencia completa de <strong>La Polla Virtual</strong> en un entorno seguro. 
            Elige el demo que mejor se adapte a tus necesidades.
        </p>

        {/* Demo Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl w-full mb-16 animate-in fade-in slide-in-from-bottom-10 duration-1000">
          {/* Enterprise Demo */}
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-[#00E676]/30 rounded-3xl p-8 hover:border-[#00E676] transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-[#00E676]/10 rounded-2xl flex items-center justify-center">
                <Building2 className="text-[#00E676]" size={28} />
              </div>
              <div className="text-left">
                <h2 className="font-russo text-2xl text-[#00E676]">DEMO EMPRESA</h2>
                <p className="text-slate-500 text-sm">Para corporativos</p>
              </div>
            </div>

            <div className="space-y-3 mb-8 text-left">
              <DemoFeature icon={<Zap size={18} />} text="Personalización de marca completa" />
              <DemoFeature icon={<BarChart3 size={18} />} text="Estadísticas por departamentos" />
              <DemoFeature icon={<Gift size={18} />} text="Gestión de premios y bonos" />
              <DemoFeature icon={<ShieldCheck size={18} />} text="Panel de administración avanzado" />
            </div>

            <button 
              onClick={() => handleStartDemo('enterprise')}
              disabled={loading}
              className="w-full bg-[#00E676] text-[#0F172A] font-black text-lg px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(0,230,118,0.3)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading && selectedDemo === 'enterprise' ? (
                <>
                  <div className="w-5 h-5 border-3 border-[#0F172A]/20 border-t-[#0F172A] rounded-full animate-spin"></div>
                  INICIANDO...
                </>
              ) : (
                <>
                  PROBAR DEMO <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>

          {/* Social Demo */}
          <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-2 border-emerald-500/30 rounded-3xl p-8 hover:border-emerald-500 transition-all duration-300 hover:scale-105 group">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-emerald-500/10 rounded-2xl flex items-center justify-center">
                <Users className="text-emerald-500" size={28} />
              </div>
              <div className="text-left">
                <h2 className="font-russo text-2xl text-emerald-500">DEMO SOCIAL</h2>
                <p className="text-slate-500 text-sm">Para amigos y familia</p>
              </div>
            </div>

            <div className="space-y-3 mb-8 text-left">
              <DemoFeature icon={<Heart size={18} />} text="Perfecto para grupos pequeños" />
              <DemoFeature icon={<TrendingUp size={18} />} text="Ranking en tiempo real" />
              <DemoFeature icon={<Sparkles size={18} />} text="Predicciones con IA" />
              <DemoFeature icon={<Rocket size={18} />} text="Configuración instantánea" />
            </div>

            <button 
              onClick={() => handleStartDemo('social')}
              disabled={loading}
              className="w-full bg-emerald-500 text-[#0F172A] font-black text-lg px-8 py-4 rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
            >
              {loading && selectedDemo === 'social' ? (
                <>
                  <div className="w-5 h-5 border-3 border-[#0F172A]/20 border-t-[#0F172A] rounded-full animate-spin"></div>
                  INICIANDO...
                </>
              ) : (
                <>
                  PROBAR DEMO <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-12 flex items-center justify-center gap-10 text-slate-500">
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
        © 2026 La Polla Virtual • Demo Experience
      </footer>
    </div>
  );
}

function DemoFeature({ icon, text }: { icon: React.ReactNode, text: string }) {
    return (
        <div className="flex items-center gap-3 text-slate-400">
            <div className="flex-shrink-0 text-[#00E676]">{icon}</div>
            <span className="text-sm">{text}</span>
        </div>
    );
}
