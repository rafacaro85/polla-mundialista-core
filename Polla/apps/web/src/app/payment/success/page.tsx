"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import api from "@/lib/api";

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("ref");
  // MP puede enviar `status` en back_urls de failure/pending
  const mpStatus = searchParams.get("status"); // 'failure' | 'pending' | null
  const [status, setStatus] = useState<"loading" | "approved" | "pending" | "rejected">("loading");

  useEffect(() => {
    const checkStatus = async () => {
      // Si MP ya indica fallo directamente en la URL, no consultamos la API
      if (mpStatus === "failure" || mpStatus === "rejected") {
        setStatus("rejected");
        return;
      }
      if (mpStatus === "pending") {
        setStatus("pending");
        return;
      }

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
  }, [reference, mpStatus]);

  useEffect(() => {
    // Redirigir automáticamente FUE ELIMINADO a petición del usuario.
    // La página ahora es estática para permitir descargar el voucher.
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
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={async () => {
                  try {
                    const response = await api.get(`/transactions/${reference}/voucher`, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([response.data]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `voucher-${reference || 'mp'}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  } catch (e) {
                      alert("Aún no se ha generado el comprobante. Intenta en unos minutos desde Mis Pollas.");
                  }
                }}
                className="w-full px-6 py-3 bg-[#00E676] text-[#0F172A] rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-[#00C853] transition-colors flex items-center justify-center gap-2"
              >
                📥 Descargar Comprobante
              </button>
              <button
                onClick={() => router.push("/social/mis-pollas")}
                className="w-full px-6 py-3 border border-[#334155] text-white rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-slate-700 transition-colors"
              >
                Entrar a Mi Polla
              </button>
            </div>
          </>
        ) : status === "rejected" ? (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-white mb-2">Pago Rechazado</h1>
            <p className="text-slate-400 mb-4">El banco rechazó la transacción por fondos insuficientes u otras razones de seguridad. Verificaremos que no te hayan debitado.</p>
          </>
        ) : (
          <>
            <Clock className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-2xl font-bold text-white mb-2">Pago en proceso</h1>
            <p className="text-slate-400 mb-4">Tu pago está siendo verificado por la pasarela. Te notificaremos cuando se confirme.</p>
          </>
        )}

        {status !== "loading" && status !== "approved" && (
          <button
            onClick={() => router.push("/social/mis-pollas")}
            className="mt-6 w-full px-6 py-3 bg-slate-700 text-white rounded-xl font-bold uppercase text-sm tracking-wider hover:bg-slate-600 transition-colors"
          >
            Volver a Mis Pollas
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
