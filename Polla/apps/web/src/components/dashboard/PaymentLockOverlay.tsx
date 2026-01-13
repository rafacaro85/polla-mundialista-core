"use client";

import React from 'react';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

import useSWR from 'swr';
import { PaymentMethods } from './PaymentMethods';

interface PaymentLockOverlayProps {
    leagueName: string;
    leagueId: string;
    amount?: number;
}

export const PaymentLockOverlay: React.FC<PaymentLockOverlayProps> = ({ leagueName, leagueId, amount = 50000 }) => {
    const { data: transaction } = useSWR(`/transactions/my-latest?leagueId=${leagueId}`, async (url) => (await api.get(url)).data);

    const isPending = transaction && transaction.status === 'PENDING';

    return (
        <div className="absolute inset-x-0 bottom-0 top-16 z-50 bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-12 text-center animate-in fade-in duration-500 overflow-y-auto">
            <div className="mb-6 p-6 bg-yellow-500/10 rounded-full border border-yellow-500/20 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
                <Shield size={64} className="text-yellow-500" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2 uppercase tracking-tight">Activación Pendiente</h1>
            <p className="text-slate-400 max-w-xs mb-4 leading-relaxed text-sm">
                La polla <strong className="text-white">{leagueName}</strong> requiere validación del pago para ser activada.
            </p>

            {isPending ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 mb-8 max-w-sm w-full animate-in fade-in zoom-in-95">
                    <Shield size={48} className="text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-yellow-500 font-russo text-xl uppercase mb-2">Pago en Revisión</h3>
                    <p className="text-slate-400 text-sm">
                        Hemos recibido tu comprobante. El administrador está validando tu pago.
                    </p>
                    <button onClick={() => window.location.reload()} className="mt-6 px-6 py-2 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-700 transition">
                        Comprobar Estado
                    </button>
                </div>
            ) : (
                <>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-4 py-2 mb-8 inline-block">
                        <span className="text-emerald-400 font-bold text-lg">
                            ${amount.toLocaleString('es-CO')} COP
                        </span>
                    </div>

                    <PaymentMethods leagueId={leagueId} amount={amount} onSuccess={() => window.location.reload()} />

                    <button onClick={() => window.location.reload()} className="text-xs text-slate-500 hover:text-white underline pb-10">
                        Recargar Página
                    </button>
                </>
            )}
        </div>
    );
};
