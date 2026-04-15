'use client';

import React from 'react';
import { useAppStore } from '@/store/useAppStore';

interface MatchAdminHomeProps {
  currentLeague: any;
  matches: any[];
}

export function MatchAdminHome({ currentLeague, matches }: MatchAdminHomeProps) {
  const { user } = useAppStore();

  // Filtrar los partidos destacados (próximos o en vivo) 
  // Para la demo, tomamos 3 próximos de "Colombia" u otros relevantes.
  const featuredMatches = matches
    .filter(m => m.status === 'SCHEDULED' || m.status === 'PENDING' || m.status === 'LIVE')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);

  return (
    <div className="relative min-h-[600px] w-full rounded-[2.5rem] overflow-hidden bg-[#0A0A0A] border border-[#1A1A1A] p-8 md:p-12 shadow-2xl flex flex-col justify-center">
      {/* Background Graphic: Negro carbón, silueta sutil, líneas verde neón */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00E676]/5 via-[#0A0A0A]/90 to-[#0A0A0A] opacity-80" />
        {/* Subtle Silhouette Pattern / Textures */}
        <div 
          className="absolute inset-0 opacity-10 bg-no-repeat bg-cover bg-center mix-blend-overlay"
          style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1518605368461-1e12dce3dc74?q=80&w=2000")' }} 
        />
        {/* Accents */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#00E676]/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#00E676]/5 rounded-full blur-[100px] pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col gap-10">
        
        {/* Encabezado: Saludo al Admin */}
        <div className="flex flex-col items-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-[#00E676] rounded-full shadow-[0_0_15px_rgba(0,230,118,0.5)]" />
            <h1 className="text-3xl md:text-5xl font-black text-white italic uppercase tracking-tighter">
              Panel del <span className="text-[#00E676]">Administrador</span>
            </h1>
          </div>
          <p className="text-[#00E676] text-sm md:text-base font-bold uppercase tracking-[0.2em] ml-1.5">
            ¡HOLA, {user?.nickname?.toUpperCase() || 'CRACK'}!
          </p>
          <p className="text-slate-400 text-sm max-w-xl mt-2 ml-1.5 leading-relaxed font-medium">
            Bienvenido al centro de control de tu Polla Match. Desde aquí podrás gestionar las transmisiones de los partidos, activar los códigos QR para las mesas y resetear los resultados en tiempo real.
          </p>
        </div>

        {/* Partidos Destacados */}
        <div className="mt-4">
          <h2 className="text-[#00E676] text-xs font-black uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse" />
            Partidos Destacados
          </h2>
          {featuredMatches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredMatches.map(match => (
                <div key={match.id} className="bg-[#111111] border border-white/5 rounded-2xl p-5 hover:border-[#00E676]/30 transition-colors group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#00E676]/5 rounded-bl-full transition-transform group-hover:scale-150" />
                  <div className="relative z-10">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-3">
                      {new Date(match.date).toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white font-bold text-sm uppercase truncate pr-2">{match.homeTeam}</span>
                      {match.homeFlag && <img src={match.homeFlag} className="w-5 h-5 rounded-full object-cover shrink-0" />}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white font-bold text-sm uppercase truncate pr-2">{match.awayTeam}</span>
                      {match.awayFlag && <img src={match.awayFlag} className="w-5 h-5 rounded-full object-cover shrink-0" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 text-center">
              <p className="text-slate-500 text-sm">No hay partidos destacados por el momento.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
