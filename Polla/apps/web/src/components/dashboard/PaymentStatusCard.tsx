"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle, Clock, CreditCard, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSWRConfig } from 'swr';
import { WompiButton } from '@/components/payments/WompiButton';

interface PaymentStatusCardProps {
    user: {
        hasPaid?: boolean;
        isVerified?: boolean;
        id: string;
    };
    pendingTransaction?: {
        id: string;
        status: string;
        createdAt: string;
    } | null;
}

export default function PaymentStatusCard({ user, pendingTransaction }: PaymentStatusCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { mutate } = useSWRConfig();

    // 1. ESTADO: APROBADO / VERIFICADO
    if (user.hasPaid) {
        return (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-4 mb-6">
                <div className="bg-emerald-500 rounded-full p-2 text-white">
                    <CheckCircle size={24} />
                </div>
                <div>
                    <h3 className="text-emerald-400 font-russo text-lg uppercase">Cuenta Verificada</h3>
                    <p className="text-slate-400 text-xs">Tu cuenta está activa y lista para jugar.</p>
                </div>
            </div>
        );
    }

    // 2. ESTADO: PENDIENTE (Pago en revisión)
    if (pendingTransaction && pendingTransaction.status === 'PENDING') {
        return (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center gap-4 mb-6">
                <div className="bg-yellow-500/20 rounded-full p-2 text-yellow-500">
                    <Clock size={24} />
                </div>
                <div className="flex-1">
                    <h3 className="text-yellow-500 font-russo text-lg uppercase">Pago en Revisión</h3>
                    <p className="text-slate-400 text-xs">Estamos validando tu comprobante. Esto puede tomar unas horas.</p>
                </div>
            </div>
        );
    }

    // 3. ESTADO: SIN PAGO (Mostrar Botón)
    return (
        <>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg relative overflow-hidden">
                {/* Decorative background glow */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

                <div className="flex items-center gap-4 w-full md:w-auto relative z-10">
                    <div className="bg-slate-700 p-3 rounded-xl border border-slate-600">
                        <AlertCircle size={28} className="text-blue-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-russo text-lg uppercase leading-tight">Activa tu Cuenta</h3>
                        <p className="text-slate-400 text-xs font-medium mt-1">
                            Realiza el pago único de <span className="text-emerald-400 font-bold">$50.000 COP</span> para participar.
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-russo text-sm uppercase rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 relative z-10"
                >
                    <CreditCard size={16} />
                    Pagar Ahora
                </button>
            </div>

            {/* MODAL DE PAGO */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center shrink-0">
                            <div>
                                <h3 className="font-russo text-white uppercase text-base">Activa tu Cuenta</h3>
                                <p className="text-slate-400 text-xs">Pago seguro con Wompi</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            {/* Wompi Payment Section */}
                            <div className="mb-4">
                                <div className="bg-gradient-to-br from-[#00E676]/10 to-emerald-500/5 border border-[#00E676]/20 rounded-2xl p-5">
                                    <div className="text-center mb-4">
                                        <h4 className="text-white font-black uppercase text-base mb-1">
                                            Pago Seguro
                                        </h4>
                                        <p className="text-slate-400 text-xs">
                                            Tarjeta débito/crédito o PSE
                                        </p>
                                    </div>

                                    <WompiButton
                                        amount={50000}
                                        onSuccess={() => {
                                            toast.success('¡Pago exitoso! Tu cuenta será activada pronto.');
                                            setIsModalOpen(false);
                                            window.location.reload();
                                        }}
                                        onError={(error) => {
                                            toast.error(`Error en el pago: ${error}`);
                                        }}
                                        className="w-full py-4 bg-[#00E676] text-[#0F172A] rounded-xl font-russo text-sm uppercase shadow-[0_4px_14px_rgba(0,230,118,0.4)] hover:shadow-[0_6px_20px_rgba(0,230,118,0.6)] hover:bg-[#00E676]/90 transition-all transform hover:-translate-y-0.5"
                                    >
                                        PAGAR $50,000 COP
                                    </WompiButton>

                                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-500 justify-center">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                        </svg>
                                        <span>Wompi (Bancolombia)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
