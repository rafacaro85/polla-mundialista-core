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
    const [selectedQR, setSelectedQR] = useState<'NEQUI' | 'DAVIPLATA' | 'BANCOLOMBIA' | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Por favor selecciona un comprobante');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('amount', '50000');
        // referenceCode y leagueId dependen del contexto, aqui es activacion de cuenta
        // Asumo que el backend maneja account activation si no se envia leagueId o se envia algo especifico
        // Revisando transactions.controller.ts: uploadTransaction params: amount, referenceCode, leagueId
        // Si es activacion de cuenta (sin liga), quizas leagueId es opcional o se envia 'GLOBAL'.
        // Voy a generar una referencia.
        
        const reference = `ACCOUNT-${user.id}-${Date.now()}`;
        formData.append('referenceCode', reference);

        try {
            await api.post('/transactions/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Comprobante subido exitosamente en revisión');
            setIsModalOpen(false);
            mutate('/auth/profile'); // Recargar usuario
            window.location.reload(); 
        } catch (error) {
            console.error('Error uploading payment:', error);
            toast.error('Error al subir el comprobante');
        } finally {
            setUploading(false);
        }
    };

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
                                <p className="text-slate-400 text-xs">Pago Manual</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto">
                            {/* Manual Payment Section */}
                            <div className="mb-4">
                                <h4 className="text-white font-bold uppercase text-sm mb-3 text-center">Selecciona Método de Pago</h4>
                                <div className="grid grid-cols-3 gap-2 mb-6">
                                    <button 
                                        onClick={() => setSelectedQR('NEQUI')}
                                        className={`p-2 rounded-xl border transition-all ${selectedQR === 'NEQUI' ? 'bg-slate-700 border-emerald-500' : 'bg-slate-700/50 border-transparent hover:bg-slate-700'}`}
                                    >
                                        <div className="text-xs font-bold text-center text-white">NEQUI</div>
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQR('DAVIPLATA')}
                                        className={`p-2 rounded-xl border transition-all ${selectedQR === 'DAVIPLATA' ? 'bg-slate-700 border-red-500' : 'bg-slate-700/50 border-transparent hover:bg-slate-700'}`}
                                    >
                                        <div className="text-xs font-bold text-center text-white">DAVIPLATA</div>
                                    </button>
                                    <button 
                                        onClick={() => setSelectedQR('BANCOLOMBIA')}
                                        className={`p-2 rounded-xl border transition-all ${selectedQR === 'BANCOLOMBIA' ? 'bg-slate-700 border-yellow-500' : 'bg-slate-700/50 border-transparent hover:bg-slate-700'}`}
                                    >
                                        <div className="text-xs font-bold text-center text-white">BANCOLOMBIA</div>
                                    </button>
                                </div>

                                {selectedQR && (
                                    <div className="bg-slate-900/50 p-4 rounded-xl mb-6 flex flex-col items-center animate-in fade-in duration-300">
                                         {/* QR Image */}
                                         <div className="w-56 h-auto bg-white rounded-lg mb-4 overflow-hidden border-4 border-white shadow-lg">
                                            {selectedQR === 'NEQUI' && <img src="/images/qr-nequi.jpg" alt="QR Nequi" className="w-full h-full object-contain" />}
                                            {selectedQR === 'DAVIPLATA' && <img src="/images/qr-daviplata.jpg" alt="QR Daviplata" className="w-full h-full object-contain" />}
                                            {selectedQR === 'BANCOLOMBIA' && <img src="/images/qr-bancolombia.jpg" alt="QR Bancolombia" className="w-full h-full object-contain" />}
                                         </div>
                                         
                                         <p className="text-sm text-slate-300 text-center mb-2">
                                            Envía <strong>$50.000</strong> a:
                                         </p>

                                         <div className="flex flex-col items-center gap-1 w-full max-w-[250px]">
                                             <div className="text-xl font-mono font-bold text-white bg-slate-800 px-4 py-2 rounded-lg border border-slate-600 select-all w-full text-center shadow-inner">
                                                 {selectedQR === 'BANCOLOMBIA' ? '27228258721' : '3105973421'}
                                             </div>
                                             <p className="text-xs text-slate-500 font-medium">
                                                {selectedQR === 'BANCOLOMBIA' ? 'Ahorros Bancolombia' : (selectedQR === 'NEQUI' ? 'Nequi' : 'Daviplata')}
                                             </p>
                                             <p className="text-[10px] text-slate-600 uppercase">
                                                Rafael Caro
                                             </p>
                                         </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        Sube tu comprobante
                                    </label>
                                    <div className="flex items-center justify-center w-full">
                                        <label htmlFor="dropzone-file-modal" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700 hover:border-slate-500'}`}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                {file ? (
                                                    <>
                                                        <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                                                        <p className="text-sm text-emerald-400 font-medium">{file.name}</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                                        <p className="text-xs text-slate-400">Click para subir imagen</p>
                                                    </>
                                                )}
                                            </div>
                                            <input id="dropzone-file-modal" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
                                        </label>
                                    </div>

                                    <button
                                        onClick={handleUpload}
                                        disabled={!file || uploading}
                                        className={`w-full py-3 rounded-xl font-bold uppercase text-sm transition-all ${!file || uploading ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'}`}
                                    >
                                        {uploading ? 'Subiendo...' : 'Confirmar Pago Manual'}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Wompi (Hidden) */}
                             <div className="mb-4 opacity-50 grayscale pointer-events-none hidden">
                                <div className="bg-gradient-to-br from-[#00E676]/10 to-emerald-500/5 border border-[#00E676]/20 rounded-2xl p-5 text-center">
                                    <h4 className="text-white font-black uppercase text-sm">Wompi (Mantenimiento)</h4>
                                </div>
                             </div>

                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
