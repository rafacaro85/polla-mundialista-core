"use client";

import { useEffect } from "react";
import { initMercadoPago, CardPayment } from "@mercadopago/sdk-react";
import { toast } from "sonner";
import api from "@/lib/api";

interface MercadoPagoButtonProps {
  amount: number;
  packageId?: string;
  leagueId?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function MercadoPagoButton({
  amount,
  packageId,
  leagueId,
  onSuccess,
  onError,
}: MercadoPagoButtonProps) {
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (publicKey) {
      initMercadoPago(publicKey, { locale: "es-CO" });
    }
  }, []);

  const handleSubmit = async ({ formData }: { selectedPaymentMethod: string; formData: Record<string, unknown> }) => {
    try {
      const response = await api.post("/payments/process-card", {
        formData,
        amount,
        packageId,
        leagueId,
      });

      const { status } = response.data;

      if (status === "approved") {
        toast.success("¡Pago exitoso! Tu liga ha sido activada.");
        onSuccess?.();
      } else if (status === "in_process" || status === "pending") {
        toast.info("Pago en proceso de verificación. Te notificaremos cuando se confirme.");
        onSuccess?.();
      } else {
        const msg = "Pago rechazado. Intenta con otra tarjeta.";
        toast.error(msg);
        onError?.(msg);
      }
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
      const message = axiosError.response?.data?.message || axiosError.message || "Error al procesar el pago";
      toast.error(message);
      onError?.(message);
    }
  };

  const handleBrickError = async (brickError: unknown) => {
    console.error("Error en CardPayment Brick:", brickError);
  };

  return (
    <div className="w-full">
      <CardPayment
        initialization={{ amount }}
        customization={{
          paymentMethods: {
            minInstallments: 1,
            maxInstallments: 1,
          },
          visual: {
            style: {
              theme: "dark",
            },
          },
        }}
        onSubmit={handleSubmit}
        onReady={() => {}}
        onError={handleBrickError}
      />
    </div>
  );
}
