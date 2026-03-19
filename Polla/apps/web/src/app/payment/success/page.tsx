"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");
  const [status, setStatus] = useState<"loading" | "approved" | "pending" | "rejected">("loading");

  useEffect(() => {
    const checkStatus = async () => {
      if (!reference) {
        setStatus("pending");
        return;
      }

      try {
        // Esperar un momento para que el webhook de MP procese
        await new Promise((resolve) => setTimeout(resolve, 2500));
        const response = await api.get(`/transactions/${reference}/status`);
        const txStatus = response.data?.status;

        if (txStatus === "APPROVED" || txStatus === "PAID") {
          setStatus("approved");
        } else if (txStatus === "REJECTED") {
          setStatus("rejected");
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    };

    checkStatus();
  }, [reference]);

  useEffect(() => {
    if (status === "loading") return;
    const timer = setTimeout(() => {
      router.push("/mis-pollas");
    }, 4000);
    return () => clearTimeout(timer);
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1E293B] rounded-2xl p-8 text-center">
        {status === "loading" ? (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[#00E676] animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Verificando pago...</h1>
            <p className="text-slate-400">Estamos confirmando tu transacción</p>
          </>
        ) : status === "approved" ? (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[#00E676]" />
            <h1 className="text-2xl font-bold text-white mb-2">¡Pago exitoso!</h1>
            <p className="text-slate-400 mb-4">Tu pago fue aprobado. Ya puedes acceder a tu polla.</p>
            <p className="text-sm text-slate-500">Redirigiendo a Mis Pollas...</p>
          </>
        ) : status === "rejected" ? (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-white mb-2">Pago rechazado</h1>
            <p className="text-slate-400 mb-4">El banco rechazó la transacción. Intenta con otro método de pago.</p>
            <p className="text-sm text-slate-500">Redirigiendo a Mis Pollas...</p>
          </>
        ) : (
          <>
            <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white mb-2">Pago en proceso</h1>
            <p className="text-slate-400 mb-4">Tu pago está siendo verificado. Te notificaremos cuando se confirme.</p>
            <p className="text-sm text-slate-500">Redirigiendo a Mis Pollas...</p>
          </>
        )}

        {status !== "loading" && (
          <button
            onClick={() => router.push("/mis-pollas")}
            className="mt-4 px-6 py-3 bg-slate-700 text-white rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-slate-600 transition-colors"
          >
            Ir a Mis Pollas ahora
          </button>
        )}
      </div>
    </div>
  );
}

export default function PaymentStatusPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4">
        <Loader2 className="w-16 h-16 text-[#00E676] animate-spin" />
      </div>
    }>
      <PaymentStatusContent />
    </Suspense>
  );
}
