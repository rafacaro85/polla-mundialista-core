"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { WompiButton } from '@/components/payments/WompiButton';

interface PaymentMethodsProps {
    leagueId: string;
    amount?: number;
    onSuccess?: () => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ leagueId, amount = 50000, onSuccess }) => {
    return (
        <div className="w-full flex flex-col items-center">
            {/* Wompi Payment Button */}
            <div className="w-full max-w-md">
                <div className="bg-gradient-to-br from-[#00E676]/10 to-emerald-500/5 border border-[#00E676]/20 rounded-2xl p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-white font-black uppercase text-lg mb-1">
                            Pago Seguro
                        </h3>
                        <p className="text-slate-400 text-xs">
                            Paga con tarjeta débito/crédito o PSE
                        </p>
                    </div>

                    <WompiButton
                        amount={amount}
                        leagueId={leagueId}
                        onSuccess={() => {
                            toast.success('¡Pago exitoso! Tu liga será activada pronto.');
                            if (onSuccess) onSuccess();
                        }}
                        onError={(error) => {
                            toast.error(`Error en el pago: ${error}`);
                        }}
                        className="w-full py-4 bg-[#00E676] text-[#0F172A] rounded-xl font-russo text-sm uppercase shadow-[0_4px_14px_rgba(0,230,118,0.4)] hover:shadow-[0_6px_20px_rgba(0,230,118,0.6)] hover:bg-[#00E676]/90 transition-all transform hover:-translate-y-0.5"
                    >
                        PAGAR ${amount.toLocaleString('es-CO')} COP
                    </WompiButton>

                    <div className="flex items-center gap-2 mt-4 text-xs text-slate-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Pago procesado por Wompi (Bancolombia)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
