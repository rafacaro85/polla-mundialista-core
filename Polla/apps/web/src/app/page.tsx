import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-center">

      {/* 1. CONTENEDOR SEGURO (FLEX COLUMN) */}
      <div className="max-w-md w-full flex flex-col items-center gap-8">

        {/* TÍTULO SIMPLE (Sin estilos raros) */}
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
          POLLA <span className="text-emerald-500">MUNDIALISTA</span>
        </h1>

        <p className="text-slate-400 text-lg">
          La plataforma profesional para tu empresa y amigos.
        </p>

        {/* 2. BOTONES ORDENADOS VERTICALMENTE */}
        <div className="w-full flex flex-col gap-4">

          {/* BOTÓN JUGADOR */}
          {/* Ajusta la ruta del Link según tu auth */}
          <Link
            href="/dashboard"
            className="w-full py-4 rounded-lg border border-slate-700 text-white font-bold hover:bg-slate-800 transition-colors"
          >
            INGRESAR / TENGO CÓDIGO
          </Link>

          {/* BOTÓN EMPRESA */}
          <Link
            href="/business/new"
            className="w-full py-4 rounded-lg bg-emerald-500 text-slate-950 font-bold hover:bg-emerald-400 transition-colors shadow-lg shadow-emerald-900/20"
          >
            CREAR POLLA EMPRESA →
          </Link>

        </div>

        {/* 3. FOOTER PEQUEÑO */}
        <div className="text-slate-600 text-sm mt-4">
          Versión Estable 1.0 • {new Date().toLocaleDateString()}
        </div>

      </div>
    </main>
  );
}
