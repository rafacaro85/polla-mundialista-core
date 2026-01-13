"use client";

import React, { useState } from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';

interface PaymentMethodsProps {
    leagueId: string;
    amount?: number;
    onSuccess?: () => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({ leagueId, amount = 50000, onSuccess }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

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
            formData.append('amount', amount.toString());
            formData.append('leagueId', leagueId);

            await api.post('/transactions/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            toast.success('Comprobante enviado. Activaremos tu liga pronto.');
            setFile(null);
            if (onSuccess) onSuccess();

        } catch (error) {
            console.error(error);
            toast.error('Error al subir el comprobante');
            setIsUploading(false);
        }
    };

    const [selectedQR, setSelectedQR] = useState<'nequi' | 'daviplata' | 'bancolombia' | null>(null);

    // Using stable CSS/SVG representations to ensure logos always load
    return (
        <div className="w-full flex flex-col items-center">

            {/* Modal for QR */}
            {selectedQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedQR(null)}>
                    <div className="bg-[#1E293B] p-6 rounded-3xl border border-slate-700 max-w-sm w-full relative shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedQR(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>

                        <div className="text-center mb-6">
                            <h3 className="text-white font-black uppercase text-xl mb-1">
                                {selectedQR === 'nequi' && 'Nequi'}
                                {selectedQR === 'daviplata' && 'Daviplata'}
                                {selectedQR === 'bancolombia' && 'Bancolombia'}
                            </h3>
                            <p className="text-[#00E676] text-xs font-bold tracking-widest uppercase">Escanear para pagar</p>
                        </div>

                        <div className="bg-white p-4 rounded-2xl mx-auto aspect-square w-64 mb-6 shadow-inner flex items-center justify-center">
                            {selectedQR === 'nequi' && <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Nequi-3105973421" alt="QR Nequi" className="w-full h-full object-contain mix-blend-multiply" />}
                            {selectedQR === 'daviplata' && <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Daviplata-3105973421" alt="QR Daviplata" className="w-full h-full object-contain mix-blend-multiply" />}
                            {selectedQR === 'bancolombia' && <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Bancolombia-Ahorros-03105973421" alt="QR Bancolombia" className="w-full h-full object-contain mix-blend-multiply" />}
                        </div>

                        <div className="text-center">
                            <p className="text-slate-400 text-xs uppercase mb-1">Número de Cuenta</p>
                            <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex items-center justify-center gap-2">
                                <span className="text-white font-mono text-lg font-bold">
                                    {selectedQR === 'bancolombia' ? '0310 597 3421' : '310 597 3421'}
                                </span>
                            </div>
                            <p className="text-slate-500 text-[10px] mt-2">(A nombre de Rafael Caro)</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Compact Bank Buttons */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md mb-6">
                {/* NEQUI */}
                <button
                    onClick={() => setSelectedQR('nequi')}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-16 h-16 rounded-[18px] bg-slate-100 border border-slate-200 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform relative overflow-hidden">
                        <div className="relative font-sans text-[#130014] font-black text-4xl tracking-tighter" style={{ fontFamily: 'Arial, sans-serif' }}>
                            N
                            <div className="absolute top-[6px] left-[1px] w-[6px] h-[6px] bg-[#DA0081]"></div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">Ver QR</span>
                </button>

                {/* DAVIPLATA */}
                <button
                    onClick={() => setSelectedQR('daviplata')}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-16 h-16 rounded-[18px] bg-[#EF3340] flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative p-1">
                        <div className="flex flex-row items-baseline relative z-10 mt-1">
                            <span className="text-white font-bold italic text-[11px] -mr-[1px] mb-[2px]">Davi</span>
                            <div className="relative">
                                <span className="text-white text-[11px] font-medium">Plata</span>
                                {/* House Loop SVG */}
                                <svg className="absolute -top-[6px] -left-[2px] w-[130%] h-[140%] pointer-events-none" viewBox="0 0 40 30" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M10 25 C 2 25, 2 10, 20 2 C 38 10, 38 25, 30 25 M30 25 L 10 25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">Ver QR</span>
                </button>

                {/* BANCOLOMBIA */}
                <button
                    onClick={() => setSelectedQR('bancolombia')}
                    className="flex flex-col items-center gap-2 group"
                >
                    <div className="w-16 h-16 rounded-[18px] bg-[#1a1a1a] border border-white/5 flex flex-col items-center justify-center shadow-lg group-hover:scale-105 transition-transform overflow-hidden relative">

                        {/* "Mi" Text */}
                        <div className="absolute top-[8px] left-[8px] text-white text-[9px] font-bold leading-none">Mi</div>

                        {/* Center Bars */}
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mt-1">
                            <rect x="4" y="6" width="16" height="3" rx="1.5" fill="white" transform="skewX(-10)" />
                            <rect x="4" y="11" width="16" height="3" rx="1.5" fill="white" transform="skewX(-10)" />
                            <rect x="4" y="16" width="16" height="3" rx="1.5" fill="white" transform="skewX(-10)" />
                        </svg>

                        {/* Bottom Corner Tricolor */}
                        <div className="absolute -bottom-1 -left-1 w-8 h-8">
                            <svg viewBox="0 0 100 100" fill="none" className="w-full h-full">
                                <path d="M0 100 Q 10 60 50 50" stroke="#FDDA24" strokeWidth="6" />
                                <path d="M20 100 Q 30 80 60 70" stroke="#0033A0" strokeWidth="6" />
                                <path d="M40 100 Q 50 95 70 90" stroke="#CE1126" strokeWidth="6" />
                            </svg>
                        </div>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-wider">Ver QR</span>
                </button>
            </div>


            {/* Upload Section */}
            <div className="w-full max-w-sm mb-8 space-y-3">
                <label className="flex items-center justify-center gap-2 text-white text-sm font-bold uppercase">
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

                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className={`w-full py-4 mt-2 rounded-xl font-russo text-sm uppercase transition-all flex items-center justify-center gap-2
                        ${file && !isUploading
                            ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.6)] transform hover:-translate-y-0.5'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                    `}
                >
                    {isUploading ? 'Validando...' : 'CONFIRMAR PAGO'}
                </button>
            </div>
        </div>
    );
};
