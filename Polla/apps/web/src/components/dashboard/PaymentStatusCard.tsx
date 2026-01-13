"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle, Clock, CreditCard, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useSWRConfig } from 'swr';

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
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
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
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('amount', '50000'); // Default amount

            await api.post('/transactions/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Comprobante subido con éxito');
            setIsModalOpen(false);
            setFile(null);

            // Refetch dashboard data? Or trigger a reload?
            // Assuming dashboard fetches user/transactions via SWR, we mutate
            mutate('/auth/me'); // To update user status if immediate? No, it's pending.
            mutate('/transactions/my-latest'); // If such endpoint exists? The parent component likely passes props.
            // Since we rely on props, we might need to rely on parent re-validation or refresh page.
            window.location.reload();

        } catch (error) {
            console.error(error);
            toast.error('Error al subir el comprobante');
        } finally {
            setIsUploading(false);
        }
    };

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
                    <Upload size={16} />
                    Subir Comprobante
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
                                <p className="text-slate-400 text-xs">Elige tu método de pago preferido</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 overflow-y-auto custom-scrollbar">

                            {/* Payment Methods Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                                {/* NEQUI */}
                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2 hover:border-[#DA0081] transition-colors group cursor-default">
                                    <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                            <span className="text-black font-bold text-4xl">QR</span>
                                        </div>
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Nequi-3105973421" alt="QR Nequi" className="w-full h-full object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-xs uppercase">Nequi</p>
                                        <p className="text-slate-400 text-[10px] font-mono">310 597 3421</p>
                                    </div>
                                </div>

                                {/* DAVIPLATA */}
                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2 hover:border-[#EF4444] transition-colors group cursor-default">
                                    <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                            <span className="text-black font-bold text-4xl">QR</span>
                                        </div>
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Daviplata-3105973421" alt="QR Daviplata" className="w-full h-full object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-xs uppercase">Daviplata</p>
                                        <p className="text-slate-400 text-[10px] font-mono">310 597 3421</p>
                                    </div>
                                </div>

                                {/* BANCOLOMBIA */}
                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-col items-center gap-2 hover:border-[#FACC15] transition-colors group cursor-default">
                                    <div className="w-full aspect-square bg-white rounded-lg flex items-center justify-center p-2 relative overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center opacity-10">
                                            <span className="text-black font-bold text-4xl">QR</span>
                                        </div>
                                        <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Bancolombia-Ahorros-03105973421" alt="QR Bancolombia" className="w-full h-full object-contain mix-blend-multiply" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white font-bold text-xs uppercase">Bancolombia</p>
                                        <p className="text-slate-400 text-[10px] font-mono whitespace-nowrap">Ahorros ****3421</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <p className="text-slate-300 text-sm">
                                    Realiza el pago único de <span className="text-emerald-400 font-bold">$50.000 COP</span>
                                    <br />
                                    <span className="text-slate-500 text-xs">(A nombre de Rafael Caro)</span>
                                </p>
                            </div>

                            {/* Upload Section */}
                            <div className="space-y-3 pt-6 border-t border-slate-700">
                                <label className="flex items-center gap-2 text-white text-sm font-bold uppercase">
                                    <Upload size={16} className="text-emerald-400" />
                                    Subir Comprobante
                                </label>
                                <label className={`
                                    flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed transition-all cursor-pointer group
                                    ${file ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-600 bg-slate-800/50 hover:border-emerald-400 hover:bg-slate-800'}
                                `}>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {file ? (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-1">
                                                <CheckCircle size={24} />
                                            </div>
                                            <p className="text-emerald-400 text-sm font-bold text-center break-all px-4">{file.name}</p>
                                            <p className="text-slate-500 text-xs">Click para cambiar</p>
                                        </>
                                    ) : (
                                        <>
                                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-slate-600 group-hover:text-white transition-colors mb-1">
                                                <Upload size={24} />
                                            </div>
                                            <p className="text-slate-300 text-sm font-bold">Seleccionar Imagen</p>
                                            <p className="text-slate-500 text-xs">JPG, PNG (Max 5MB)</p>
                                        </>
                                    )}
                                </label>
                            </div>

                            <button
                                onClick={handleUpload}
                                disabled={!file || isUploading}
                                className={`w-full py-4 mt-6 rounded-xl font-russo text-sm uppercase transition-all flex items-center justify-center gap-2
                                    ${file && !isUploading
                                        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)] transform hover:-translate-y-0.5'
                                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                                `}
                            >
                                {isUploading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                                        Validando...
                                    </>
                                ) : 'ENVIAR COMPROBANTE'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
