"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface WompiButtonProps {
  amount: number; // En pesos (ej: 50000)
  packageId?: string;
  leagueId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  className?: string;
}

declare global {
  interface Window {
    WidgetCheckout: any;
  }
}

export function WompiButton({
  amount,
  packageId,
  leagueId,
  onSuccess,
  onError,
  children,
  className = "",
}: WompiButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (loading) return; // Prevenir doble click

    setLoading(true);

    try {
      // 1. Solicitar firma al backend
      const response = await fetch("/api/payments/signature", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount,
          currency: "COP",
          packageId,
          leagueId,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar la firma de pago");
      }

      const signatureData = await response.json();

      // 2. Verificar que el script de Wompi esté cargado
      if (typeof window.WidgetCheckout === "undefined") {
        throw new Error("Widget de Wompi no está cargado");
      }

      // 3. Configurar el widget de Wompi
      const checkout = new window.WidgetCheckout({
        currency: "COP",
        amountInCents: signatureData.amountInCents,
        reference: signatureData.reference,
        publicKey: process.env.NEXT_PUBLIC_WOMPI_PUB_KEY,
        signature: {
          integrity: signatureData.integritySignature,
        },
        redirectUrl: `${window.location.origin}/payment/success?ref=${signatureData.reference}`,
      });

      // 4. Abrir el widget
      checkout.open((result: any) => {
        if (result.transaction?.status === "APPROVED") {
          toast.success("¡Pago exitoso! Tu pago ha sido procesado correctamente.");
          onSuccess?.();
        } else if (result.transaction?.status === "DECLINED") {
          toast.error("Pago rechazado. Por favor, intenta nuevamente.");
          onError?.("Pago rechazado");
        }
        setLoading(false);
      });
    } catch (error: any) {
      console.error("Error al procesar el pago:", error);
      toast.error(error.message || "Ocurrió un error al procesar el pago");
      onError?.(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className={`relative ${className}`}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </div>
      )}
      {children || "Pagar con Wompi"}
    </button>
  );
}
