'use client';

import React from 'react';
import { Trophy, Users, Target, Calculator, Star, Medal, Bot, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

const CARD_CLASS = 'w-[calc(100vw-3rem)] md:w-[340px] shrink-0 snap-center snap-always bg-[#1E293B] border border-white/10 rounded-3xl p-6 flex flex-col';

export function HowItWorksSection() {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      scrollRef.current.scrollTo({
        left: direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="py-10">
      <div className="px-6 mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-6 h-1 bg-[#00E676] rounded-full" />
          <h2 className="text-xl font-russo text-white tracking-tight uppercase">Cómo funciona</h2>
        </div>
        <div className="hidden md:flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-[#00E676] hover:text-[#050505] transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-[#00E676] hover:text-[#050505] transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Scroll container: padding lateral actúa como "scroll-padding" para centrar las tarjetas en snap */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto gap-4 pb-6 snap-x snap-mandatory"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none' as any,
          scrollSnapType: 'x mandatory',
          paddingInline: '1.5rem',
          scrollPaddingInline: '1.5rem',
        }}
      >
        {/* Tarjeta 1: El Objetivo */}
        <div className={CARD_CLASS}>
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-[#00E676]">
            <Trophy size={20} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">☆ El Objetivo</h3>
          <p className="text-xs text-slate-400 leading-relaxed mb-4">
            Acumular la mayor cantidad de puntos prediciendo los resultados. Compites en una tabla privada con tus amigos.
          </p>
          <div className="space-y-2 mt-auto">
            {['Predice marcadores', 'Suma puntos', 'Gana el trofeo'].map((step, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/5 p-2 rounded-lg">
                <span className="text-[#00E676] font-black text-xs">{i + 1}.</span>
                <span className="text-xs font-bold text-white uppercase">{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta 2: Tu Polla */}
        <div className={CARD_CLASS}>
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-[#00E676]">
            <Users size={20} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">☆ Tu Polla</h3>
          <div className="space-y-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="text-white font-bold mb-1 uppercase tracking-tight text-xs">1. Crea la tuya</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">Obtén un código único y enlace mágico para invitar por WhatsApp.</p>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <p className="text-white font-bold mb-1 uppercase tracking-tight text-xs">2. Únete</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">Haz clic en el enlace mágico o escribe el código de invitación.</p>
            </div>
          </div>
        </div>

        {/* Tarjeta 3: Predicciones */}
        <div className={CARD_CLASS}>
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-[#00E676]">
            <Target size={20} />
          </div>
          <h3 className="text-base font-bold text-white mb-2">☆ Predicciones</h3>
          <div className="space-y-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs font-black text-[#00E676] mb-1">■ GRUPOS</p>
              <p className="text-[11px] text-slate-400 leading-tight">Marcador exacto. Edita hasta 5 min antes del pitazo.</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs font-black text-blue-400 mb-1">■ FINAL (KO)</p>
              <p className="text-[11px] text-slate-400 leading-tight">Predice quién avanza. Usa el Simulador de llaves.</p>
            </div>
            <div className="p-3 bg-[#00E676]/10 rounded-xl border border-[#00E676]/20">
              <p className="text-xs font-black text-white flex items-center gap-1"><Bot size={12} /> SUGERIR CON IA</p>
              <p className="text-[11px] text-white/50 leading-tight">Llenamos tus predicciones con estadísticas históricas.</p>
            </div>
          </div>
        </div>

        {/* Tarjeta 4: Puntos */}
        <div className={CARD_CLASS}>
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-[#00E676]">
            <Calculator size={20} />
          </div>
          <h3 className="text-base font-bold text-white mb-3">☆ Puntos</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="p-2 bg-white/5 rounded-lg text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Exacto</p>
              <p className="text-lg font-black text-[#00E676]">3 pts</p>
            </div>
            <div className="p-2 bg-white/5 rounded-lg text-center">
              <p className="text-[10px] text-slate-500 font-bold uppercase">Resultado</p>
              <p className="text-lg font-black text-white">2 pts</p>
            </div>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5 mb-2">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Bonus Goles</p>
            <p className="text-[11px] mt-1 text-slate-400">+1 punto por cada equipo acertado en goles.</p>
          </div>
          <div className="bg-white/5 p-3 rounded-xl border border-white/5">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1"><span>Gran Final</span><span className="text-[#00E676]">20 pts</span></div>
            <div className="flex justify-between text-[10px] font-bold text-slate-500"><span>Semifinal</span><span className="text-white">10 pts</span></div>
          </div>
        </div>

        {/* Tarjeta 5: Bonus */}
        <div className={CARD_CLASS}>
          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center mb-4 text-[#00E676]">
            <Star size={20} />
          </div>
          <h3 className="text-base font-bold text-white mb-3">☆ Bonus</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <p className="text-xs font-bold text-white mb-1 uppercase tracking-tight">Preguntas Especiales</p>
              <p className="text-[11px] text-slate-400">¿Quién será campeón? (+10 pts) | Goleador (+5 pts)</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
              <p className="text-xs font-black text-yellow-500 flex items-center gap-1 mb-1"><Zap size={12} /> COMODÍN x2</p>
              <p className="text-[11px] text-yellow-500/70">Duplica los puntos. Solo 1 uso por fase.</p>
            </div>
          </div>
        </div>

        {/* Tarjeta 6: Ranking */}
        <div className={`${CARD_CLASS} items-center justify-center text-center`}>
          <div className="w-14 h-14 bg-[#00E676]/10 rounded-full flex items-center justify-center mb-4 border border-[#00E676]/20">
            <Medal size={28} className="text-[#00E676]" />
          </div>
          <h3 className="text-base font-bold text-white mb-2">☆ Ranking</h3>
          <p className="text-xs text-slate-400 leading-relaxed max-w-[200px]">
            La gloria te espera. Tabla de posiciones actualizada en tiempo real después de cada partido.
          </p>
        </div>
      </div>
    </section>
  );
}
