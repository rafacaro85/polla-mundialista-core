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
        formData.append('amount', amount.toString());
        formData.append('leagueId', leagueId);
        
        // Generar referencia simple si no existe
        const reference = `MANUAL-${Date.now()}`;
        formData.append('referenceCode', reference);

        try {
            await api.post('/transactions/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success('Comprobante subido exitosamente en revisión');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error uploading payment:', error);
            toast.error('Error al subir el comprobante');
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full flex flex-col items-center gap-6">
            {/* Manual Payment Section */}
            <div className="w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <h3 className="text-white font-black uppercase text-lg mb-4 text-center">
                    Pago Manual
                </h3>
                
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
                            Envía <strong>${amount.toLocaleString('es-CO')}</strong> a:
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
                        <label htmlFor="dropzone-file" className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${file ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-600 bg-slate-700/50 hover:bg-slate-700 hover:border-slate-500'}`}>
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
                            <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/*" />
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

            {/* Wompi Payment Button (Temporarily Hidden) */}
            <div className="w-full max-w-md opacity-50 grayscale pointer-events-none hidden"> 
                <div className="bg-gradient-to-br from-[#00E676]/10 to-emerald-500/5 border border-[#00E676]/20 rounded-2xl p-6">
                    <div className="text-center mb-4">
                        <h3 className="text-white font-black uppercase text-lg mb-1">
                            Pago Seguro (Mantenimiento)
                        </h3>
                    </div>
                </div>
            </div>
        </div>
    );
};
