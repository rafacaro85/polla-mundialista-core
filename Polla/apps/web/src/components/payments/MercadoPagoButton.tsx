"use client";

import { useEffect } from "react";
import { initMercadoPago, Payment } from "@mercadopago/sdk-react";
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

  // Garantiza un amount válido. Mínimo 1000 (límite inferior de MP para COL)
  const safeAmount = amount && amount > 0 ? amount : 1000;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSubmit = async (paymentData: any) => {
    const selectedPaymentMethod = paymentData?.selectedPaymentMethod ?? paymentData?.payment_method_id;
    const formData = paymentData?.formData ?? paymentData;

    if (!formData) {
      const msg = "No se recibieron datos del formulario de pago.";
      toast.error(msg);
      onError?.(msg);
      return;
    }

    try {
      const response = await api.post("/payments/process-card", {
        formData,
        selectedPaymentMethod,
        amount: safeAmount,
        packageId,
        leagueId,
      });

      const { status, redirectUrl } = response.data;

      if (status === "approved") {
        toast.success("¡Pago exitoso! Tu liga ha sido activada.");
        onSuccess?.();
      } else if (status === "in_process" || status === "pending") {
        if (redirectUrl) {
          toast.info("Redirigiendo a tu banco para completar el pago...");
          window.location.href = redirectUrl;
          return;
        }
        toast.info("Pago en proceso de verificación. Te notificaremos cuando se confirme.");
        onSuccess?.();
      } else {
        const msg = "Pago rechazado. Intenta con otro método de pago.";
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

  return (
    <div className="w-full">
      <Payment
        initialization={{
          amount: safeAmount,
          preferenceId: undefined,
        }}
        customization={{
          paymentMethods: {
            bankTransfer: "all",
            creditCard: "all",
            debitCard: "all",
          },
          visual: {
            style: {
              theme: "dark",
            },
          },
        }}
        onSubmit={handleSubmit}
        onReady={() => {}}
        onError={(brickError) => console.error("MP Brick error:", brickError)}
      />
    </div>
  );
}
