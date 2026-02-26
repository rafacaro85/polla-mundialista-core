"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error caught by Next.js error.tsx:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0F172A] text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full relative overflow-hidden flex flex-col items-center text-center">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>

        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertCircle className="w-8 h-8 text-red-500" />
        </div>

        <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">
          ERROR INESPERADO
        </h2>

        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          Lo sentimos, ha ocurrido un error al cargar la página. Nuestro equipo ha sido notificado.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Button
            onClick={() => reset()}
            className="bg-[#00E676] text-[#0F172A] hover:bg-white font-bold rounded-full py-6 flex-1 transition-transform hover:scale-105"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Reintentar
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-white/10 text-slate-300 hover:text-white hover:bg-white/5 rounded-full py-6 flex-1"
          >
            <Link href="/">
              <Home className="w-5 h-5 mr-2" />
              Ir al Inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
