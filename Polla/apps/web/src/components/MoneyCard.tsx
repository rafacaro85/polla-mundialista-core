'use client';

import React, { useEffect, useRef, useState } from 'react';

interface MoneyCardProps {
  amount: number;
  label?: string;
  variant?: 'full' | 'compact';
}

/** Formatea un número al estilo COP: 500000 → "500.000" */
function formatCOP(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Hook que anima un número de 0 → target en `duration` ms */
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!target) return;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubico
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [target, duration]);

  return count;
}

/* ──────────────────────────────────────────────────────────────
   VARIANTE FULL — Home de la polla (bloque Premio Mayor)
────────────────────────────────────────────────────────────── */
function MoneyCardFull({ amount, label = 'AL GANADOR' }: { amount: number; label?: string }) {
  const animated = useCountUp(amount);

  return (
    <div
      className="relative w-full h-full min-h-[160px] rounded-2xl overflow-hidden flex flex-col items-start justify-center p-6 sm:p-8"
      style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1a1f2e 50%, #0F172A 100%)',
        border: '1px solid rgba(250,204,21,0.25)',
        boxShadow: '0 0 40px rgba(250,204,21,0.08), inset 0 0 60px rgba(0,0,0,0.4)',
      }}
    >
      {/* Destellos en esquinas */}
      <Sparkle top="10px" left="12px" />
      <Sparkle top="10px" right="12px" />
      <Sparkle bottom="10px" left="12px" />
      <Sparkle bottom="10px" right="12px" />

      {/* Glow de fondo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 60%, rgba(0,230,118,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex flex-col items-start justify-center h-full w-full gap-1 overflow-hidden">
        {/* Header */}
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400/70 whitespace-nowrap">
          PREMIO MAYOR
        </p>

        {/* Símbolo $ */}
        <span className="text-yellow-400 text-sm sm:text-lg font-black leading-none -mb-1">$</span>

        {/* Cifra animada */}
        <p
          className="font-russo text-white leading-none whitespace-nowrap"
          style={{
            fontSize: 'clamp(1.5rem, 8vw, 3.5rem)',
            color: '#00E676',
            textShadow: '0 0 20px rgba(0,230,118,0.5), 0 0 40px rgba(0,230,118,0.3)',
          }}
        >
          {formatCOP(animated)}
        </p>

        {/* Línea separadora */}
        <div className="w-full h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent my-1" />

        {/* Subtexto */}
        <p className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 whitespace-nowrap">
          {label}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   VARIANTE COMPACT — Tarjeta de Mis Pollas
────────────────────────────────────────────────────────────── */
function MoneyCardCompact({ amount }: { amount: number }) {
  const animated = useCountUp(amount, 1200);

  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
      style={{
        background: 'linear-gradient(135deg, #1a1a0a 0%, #1E293B 100%)',
        border: '1px solid rgba(250,204,21,0.35)',
        boxShadow: '0 0 12px rgba(250,204,21,0.12)',
      }}
    >
      <span className="text-yellow-400 text-xs font-black">$</span>
      <span
        className="font-russo text-sm"
        style={{
          color: '#00E676',
          textShadow: '0 0 8px rgba(0,230,118,0.5)',
        }}
      >
        {formatCOP(animated)}
      </span>
      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
        AL GANADOR
      </span>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Componente de destello (estrellita dorada)
────────────────────────────────────────────────────────────── */
function Sparkle({ top, bottom, left, right }: { top?: string; bottom?: string; left?: string; right?: string }) {
  return (
    <div
      className="absolute text-yellow-400 text-xs pointer-events-none select-none"
      style={{ top, bottom, left, right, opacity: 0.7, fontSize: '14px' }}
    >
      ✦
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Export principal
────────────────────────────────────────────────────────────── */
export function MoneyCard({ amount, label, variant = 'full' }: MoneyCardProps) {
  if (variant === 'compact') return <MoneyCardCompact amount={amount} />;
  return <MoneyCardFull amount={amount} label={label} />;
}
