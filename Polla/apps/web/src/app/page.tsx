import React from 'react';

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">

      {/* EFECTO DE FONDO (Seguro) */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10"></div>

      <div className="max-w-md w-full flex flex-col items-center gap-10 z-10">

        {/* 1. TÍTULO CON GRADIENTE */}
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-tight">
            POLLA <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
              MUNDIALISTA
            </span>
          </h1>
          <p className="text-slate-400 text-lg md:text-xl font-light max-w-sm mx-auto">
            Gestiona tu torneo corporativo o de amigos con tecnología profesional.
          </p>
        </div>

        {/* 2. BOTONES DE ACCIÓN (ESTILIZADOS) */}
        <div className="w-full flex flex-col gap-5">

          {/* Botón Jugador (Outline) */}
          <a
            href="/dashboard"
            className="group w-full py-4 rounded-xl border border-slate-700 hover:border-emerald-500/50 bg-slate-900/50 text-white font-semibold transition-all duration-300 flex items-center justify-center gap-3 backdrop-blur-sm"
          >
            <span>⚽</span> Ingresar / Tengo Código
          </a>

          {/* Botón Empresa (Solid & Glow) */}
          <a
            href="/business/new"
            className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-lg shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2"
          >
            🏢 CREAR POLLA EMPRESA →
          </a>

        </div>

        {/* 3. FOOTER */}
        <div className="text-slate-600 text-xs font-medium uppercase tracking-widest mt-8">
          Plataforma Oficial • {new Date().getFullYear()}
        </div>

      </div>
    </main>
  );
}
