"use client";

import React from "react";
import Link from "next/link";
import { Trophy, Beaker } from "lucide-react"; // Assuming lucide-react is available, or use standard SVGs

const MAIN_APP_URL = process.env.NEXT_PUBLIC_MAIN_APP_URL || "https://lapollavirtual.com"; // Fallback
const BETA_APP_URL = process.env.NEXT_PUBLIC_BETA_URL || "https://champions.lapollavirtual.com"; // Fallback

export default function TournamentHub() {
  const [championsUrl, setChampionsUrl] = React.useState(`${BETA_APP_URL}/dashboard`);

  React.useEffect(() => {
    // Si hay token, construir URL de "auto-login" para el dominio beta
    const token = localStorage.getItem('token');
    if (token) {
      // Usar encodeURIComponent para asegurar que caracteres especiales del JWT no rompan la URL
      const safeToken = encodeURIComponent(token);
      setChampionsUrl(`${BETA_APP_URL}/auth/success?token=${safeToken}&redirect=/dashboard`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 font-sans text-white">
      <div className="max-w-4xl w-full">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2">
          Selecciona tu Torneo
        </h1>
        <p className="text-slate-400 text-center mb-12">
          Elige en qué competencia deseas participar ahora.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Card 1: Mundial 2026 (Main App) */}
          <a
            href={`${MAIN_APP_URL}/dashboard`}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 hover:border-emerald-500 transition-all duration-300 p-8 flex flex-col items-center text-center shadow-xl hover:shadow-2xl hover:shadow-emerald-900/20"
          >
            <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
              <img 
                src="/images/wc-logo.png" 
                alt="FIFA World Cup 2026" 
                className="h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]"
              />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Mundial 2026</h2>
            <p className="text-sm text-slate-400 mb-6">
              La competencia principal. Predice los resultados de la Copa del Mundo 2026.
            </p>
            <span className="inline-block px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors transform group-hover:scale-105 duration-300 shadow-lg shadow-emerald-500/20">
              Ir al Torneo
            </span>
          </a>

          {/* Card 2: Champions League (Beta) */}
          <a
            href={championsUrl}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-900 to-slate-900 border border-blue-800 hover:border-blue-400 transition-all duration-300 p-8 flex flex-col items-center text-center shadow-xl hover:shadow-2xl hover:shadow-blue-900/20"
          >
            <div className="absolute top-4 right-4 bg-blue-500 text-xs font-bold px-2 py-1 rounded text-white shadow-lg animate-pulse">
              BETA
            </div>
            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
              <img 
                src="/images/ucl-logo.png" 
                alt="UEFA Champions League" 
                className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-lg" 
              />
            </div>
            <h2 className="text-2xl font-bold mb-2 text-white">Champions League 25/26</h2>
            <p className="text-sm text-slate-400 mb-6">
              Versión de prueba. Participa en la fase final de la UEFA Champions League.
            </p>
            <span className="inline-block px-6 py-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors">
              Probar Beta
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
