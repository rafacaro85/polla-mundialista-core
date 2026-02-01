"use client";

import { useState, useEffect } from "react";
import { Loader2, RefreshCw } from "lucide-react";
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

const WOMPI_SCRIPT_URL = "https://checkout.wompi.co/widget.js";
const SCRIPT_ID = "wompi-widget-script";

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
  const [scriptStatus, setScriptStatus] = useState<"loading" | "ready" | "error">("loading");

  // Cargar el script de Wompi dinámicamente
  useEffect(() => {
    const loadWompiScript = () => {
      // Verificar si el script ya está cargado
      if (typeof window.WidgetCheckout !== "undefined") {
        setScriptStatus("ready");
        return;
      }

      // Verificar si el script ya existe en el DOM
      const existingScript = document.getElementById(SCRIPT_ID);
      if (existingScript) {
        // El script existe pero puede no haber cargado aún
        // Esperar a que window.WidgetCheckout esté disponible
        const checkInterval = setInterval(() => {
          if (typeof window.WidgetCheckout !== "undefined") {
            setScriptStatus("ready");
            clearInterval(checkInterval);
          }
        }, 100);

        // Timeout de 15 segundos
        setTimeout(() => {
          clearInterval(checkInterval);
          if (typeof window.WidgetCheckout === "undefined") {
            setScriptStatus("error");
          }
        }, 15000);
        return;
      }

      // Crear y cargar el script dinámicamente
      const script = document.createElement("script");
      script.id = SCRIPT_ID;
      script.src = WOMPI_SCRIPT_URL;
      script.async = true;

      script.onload = () => {
        // Verificar que WidgetCheckout esté disponible
        if (typeof window.WidgetCheckout !== "undefined") {
          setScriptStatus("ready");
        } else {
          // A veces el script carga pero WidgetCheckout no está inmediatamente disponible
          setTimeout(() => {
            if (typeof window.WidgetCheckout !== "undefined") {
              setScriptStatus("ready");
            } else {
              setScriptStatus("error");
            }
          }, 500);
        }
      };

      script.onerror = () => {
        console.error("Error al cargar el script de Wompi");
        setScriptStatus("error");
      };

      document.body.appendChild(script);
    };

    loadWompiScript();
  }, []);

  const handleRetry = () => {
    setScriptStatus("loading");
    
    // Eliminar el script existente si hay uno
    const existingScript = document.getElementById(SCRIPT_ID);
    if (existingScript) {
      existingScript.remove();
    }

    // Reintentar carga
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = WOMPI_SCRIPT_URL;
    script.async = true;

    script.onload = () => {
      if (typeof window.WidgetCheckout !== "undefined") {
        setScriptStatus("ready");
        toast.success("Sistema de pagos cargado correctamente");
      } else {
        setTimeout(() => {
          if (typeof window.WidgetCheckout !== "undefined") {
            setScriptStatus("ready");
            toast.success("Sistema de pagos cargado correctamente");
          } else {
            setScriptStatus("error");
          }
        }, 500);
      }
    };

    script.onerror = () => {
      setScriptStatus("error");
      toast.error("No se pudo cargar el sistema de pagos. Verifica tu conexión.");
    };

    document.body.appendChild(script);
  };

  const handlePayment = async () => {
    if (loading || scriptStatus !== "ready") return;

    // Safety check final
    if (typeof window.WidgetCheckout === "undefined") {
      toast.error("El sistema de pagos no está disponible. Intenta recargar la página.");
      setScriptStatus("error");
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

      // 2. Configurar el widget de Wompi
      const checkout = new window.WidgetCheckout({
        currency: "COP",
        amountInCents: signatureData.amountInCents,
        reference: signatureData.reference,
        publicKey: 'pub_test_XrGpTNMdKbnbwYqpmgACkFwbcbxXevcu', // HOTFIX: Hardcoded para Vercel (process.env.NEXT_PUBLIC_WOMPI_PUB_KEY retorna undefined)
        signature: {
          integrity: signatureData.integritySignature,
        },
        redirectUrl: `${window.location.origin}/payment/success?ref=${signatureData.reference}`,
      });

      // 3. Abrir el widget
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

  // Estado de error: mostrar botón de reintentar
  if (scriptStatus === "error") {
    return (
      <button
        onClick={handleRetry}
        className={`relative ${className} bg-yellow-600 hover:bg-yellow-500`}
      >
        <div className="flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" />
          <span>Reintentar Carga</span>
        </div>
      </button>
    );
  }

  const isDisabled = loading || scriptStatus !== "ready";

  return (
    <button
      onClick={handlePayment}
      disabled={isDisabled}
      className={`relative ${className} ${isDisabled ? 'opacity-70 cursor-wait' : ''}`}
      title={scriptStatus === "loading" ? "Cargando pasarela de pagos..." : ""}
    >
      {scriptStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-white" />
            <span className="text-xs text-white">Cargando pasarela...</span>
          </div>
        </div>
      )}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
          <Loader2 className="w-5 h-5 animate-spin text-white" />
        </div>
      )}
      {children || "Pagar con Wompi"}
    </button>
  );
}
