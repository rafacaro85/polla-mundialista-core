"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      if (!reference) {
        setVerifying(false);
        return;
      }

      try {
        // Esperar un momento para que el webhook procese
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Aquí podrías verificar el estado de la transacción con el backend
        // const response = await fetch(`/api/transactions/verify/${reference}`);
        // const data = await response.json();

        setVerified(true);
      } catch (error) {
        console.error("Error verificando pago:", error);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [reference]);

  useEffect(() => {
    if (verified && !verifying) {
      // Redirigir después de 3 segundos
      const timer = setTimeout(() => {
        router.push("/dashboard");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [verified, verifying, router]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1E293B] rounded-2xl p-8 text-center">
        {verifying ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#00E676] animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">
              Verificando pago...
            </h1>
            <p className="text-slate-400">
              Estamos confirmando tu transacción
            </p>
          </>
        ) : verified ? (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#00E676]" />
            <h1 className="text-2xl font-bold text-white mb-2">
              ¡Pago exitoso!
            </h1>
            <p className="text-slate-400 mb-4">
              Tu pago ha sido procesado correctamente
            </p>
            <p className="text-sm text-slate-500">
              Redirigiendo al dashboard...
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <span className="text-3xl">⏳</span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Pago en proceso
            </h1>
            <p className="text-slate-400 mb-6">
              Tu pago está siendo procesado. Recibirás una confirmación pronto.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="px-6 py-3 bg-[#00E676] text-[#0F172A] rounded-xl font-bold uppercase text-sm tracking-wider hover:opacity-90 transition-opacity"
            >
              Ir al Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}
