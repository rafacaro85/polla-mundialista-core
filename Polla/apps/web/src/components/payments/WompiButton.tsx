"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";

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
  const [isWidgetReady, setIsWidgetReady] = useState(false);

  // Verificar si el script de Wompi está cargado
  useEffect(() => {
    const checkWidgetAvailability = () => {
      if (typeof window !== "undefined" && typeof window.WidgetCheckout !== "undefined") {
        setIsWidgetReady(true);
        return true;
      }
      return false;
    };

    // Verificar inmediatamente
    if (checkWidgetAvailability()) {
      return;
    }

    // Si no está disponible, hacer polling cada 100ms hasta que esté listo
    const interval = setInterval(() => {
      if (checkWidgetAvailability()) {
        clearInterval(interval);
      }
    }, 100);

    // Timeout de 10 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!isWidgetReady) {
        console.warn("Wompi widget no se cargó después de 10 segundos");
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handlePayment = async () => {
    if (loading) return; // Prevenir doble click

    // Safety check: verificar que el widget esté disponible
    if (typeof window.WidgetCheckout === "undefined") {
      toast.error("El sistema de pagos está cargando, intenta en 2 segundos...");
      return;
    }

    setLoading(true);

    try {
      // 1. Solicitar firma al backend usando axios (con auth interceptor)
      const response = await api.post("/payments/signature", {
        amount,
        currency: "COP",
        packageId,
        leagueId,
      });

      const signatureData = response.data;

      // 2. Verificar nuevamente que el script de Wompi esté cargado
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
      const errorMessage = error.response?.data?.message || error.message || "Ocurrió un error al procesar el pago";
      toast.error(errorMessage);
      onError?.(errorMessage);
      setLoading(false);
    }
  };

  const isDisabled = loading || !isWidgetReady;

  return (
    <button
      onClick={handlePayment}
      disabled={isDisabled}
      className={`relative ${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={!isWidgetReady ? "Cargando sistema de pagos..." : ""}
    >
      {(loading || !isWidgetReady) && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </div>
      )}
      {children || "Pagar con Wompi"}
    </button>
  );
}
