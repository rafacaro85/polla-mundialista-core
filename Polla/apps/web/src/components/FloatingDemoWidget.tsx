'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  PlayCircle, 
  Building2, 
  Users, 
  ArrowRight, 
  ChevronLeft,
  ChevronRight,
  Zap,
  Trophy,
  Settings,
  ShieldCheck
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export function FloatingDemoWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedDemo, setSelectedDemo] = useState<'enterprise' | 'social' | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Show widget briefly on mount, then auto-collapse
    setIsOpen(true);
    const timer = setTimeout(() => {
      setIsOpen(false);
    }, 3000); // Show for 3 seconds

    return () => clearTimeout(timer);
  }, []);

  const handleStartDemo = async (type: 'enterprise' | 'social') => {
    setLoading(true);
    setSelectedDemo(type);
    
    try {
      const endpoint = type === 'enterprise' ? '/demo/start/enterprise' : '/demo/start/social';
      const { data } = await api.post(endpoint);
      
      // Store credentials
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      toast.success(`¡Demo ${type === 'enterprise' ? 'Empresarial' : 'Social'} iniciado!`);
      
      // Redirect to league
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
    <div className={`fixed bottom-6 right-6 z-[100] transition-all duration-500 transform ${isOpen ? 'translate-x-0' : 'translate-x-[calc(100%-3.5rem)]'}`}>
      <div className="flex items-start gap-0">
        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="bg-gradient-to-r from-[#00E676] to-emerald-400 text-[#0F172A] p-3 rounded-l-xl shadow-2xl hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105 mt-4 relative group"
          aria-label={isOpen ? "Contraer demos" : "Expandir demos"}
        >
          {isOpen ? <ChevronRight size={24} strokeWidth={3} /> : <ChevronLeft size={24} strokeWidth={3} />}
          
          {/* Pulse indicator when collapsed */}
          {!isOpen && (
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          )}
        </button>

        {/* Main Card */}
        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] rounded-r-xl rounded-tl-xl border-2 border-[#00E676]/30 shadow-2xl p-6 w-80 backdrop-blur-md">
          {/* Badge */}
          <div className="absolute -top-3 -right-3 bg-gradient-to-r from-[#00E676] to-emerald-400 text-[#0F172A] font-black text-xs px-4 py-2 rounded-lg shadow-lg animate-bounce">
            ¡PRUÉBALO GRATIS!
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#00E676]/10 rounded-xl flex items-center justify-center">
                <PlayCircle className="text-[#00E676]" size={28} />
              </div>
              <div>
                <h3 className="font-russo text-xl text-white">DEMOS INTERACTIVOS</h3>
                <p className="text-slate-400 text-xs">Explora sin compromiso</p>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm mb-4 leading-relaxed">
              Experimenta <strong className="text-[#00E676]">La Polla Virtual</strong> en acción. Elige tu demo y empieza ahora.
            </p>

            {/* Demo Buttons */}
            <div className="space-y-2">
              <button 
                onClick={() => handleStartDemo('enterprise')}
                disabled={loading}
                className="w-full bg-[#00E676] hover:bg-emerald-400 disabled:opacity-50 text-[#0F172A] font-black py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 shadow-lg shadow-emerald-500/20 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Building2 size={18} />
                  <span className="text-sm">Demo Empresarial</span>
                </div>
                {loading && selectedDemo === 'enterprise' ? (
                  <div className="w-4 h-4 border-2 border-[#0F172A]/20 border-t-[#0F172A] rounded-full animate-spin"></div>
                ) : (
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                )}
              </button>

              <button 
                onClick={() => handleStartDemo('social')}
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 disabled:opacity-50 border-2 border-white/20 hover:border-white/40 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:scale-105 flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Users size={18} />
                  <span className="text-sm">Demo Social</span>
                </div>
                {loading && selectedDemo === 'social' ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <ArrowRight className="group-hover:translate-x-1 transition-transform" size={18} />
                )}
              </button>
            </div>

            {/* Features */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <Zap size={12} className="text-[#00E676]" />
                <span>Simulación IA</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Trophy size={12} className="text-[#00E676]" />
                <span>Ranking Live</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Settings size={12} className="text-[#00E676]" />
                <span>Panel Admin</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <ShieldCheck size={12} className="text-[#00E676]" />
                <span>100% Seguro</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
