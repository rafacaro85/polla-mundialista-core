"use client";

import React, { useState } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { Check, X, Search, Image as ImageIcon, Copy, ExternalLink, Calendar, ArrowLeft } from 'lucide-react';

interface Transaction {
    id: string;
    amount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
    imageUrl: string;
    referenceCode: string;
    createdAt: string;
    user: {
        id: string;
        fullName: string;
        email: string;
    };
    league?: {
        id: string;
        name: string;
    };
}

export default function AdminTransactionsPage() {
    const { data: transactions, isLoading } = useSWR<Transaction[]>('/transactions/pending', async (url: string) => (await api.get(url)).data);
    const { mutate } = useSWRConfig();
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const handleStatusUpdate = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        if (!confirm(`¿Estás seguro de ${status === 'APPROVED' ? 'APROBAR' : 'RECHAZAR'} esta transacción?`)) return;

        try {
            setProcessingId(id);
            await api.patch(`/transactions/${id}/status`, { status });
            toast.success(`Transacción ${status === 'APPROVED' ? 'Aprobada' : 'Rechazada'}`);
            mutate('/transactions/pending');
        } catch (error) {
            console.error(error);
            toast.error('Error al actualizar estado');
        } finally {
            setProcessingId(null);
        }
    };

    if (isLoading) return <div className="p-8 text-white font-mono text-center">Cargando pagos pendientes...</div>;

    return (
        <div className="min-h-screen bg-[#0F172A] p-6 lg:p-10 font-sans text-white">
            <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/super-admin" className="bg-slate-800 p-2 rounded-lg hover:bg-slate-700 transition-colors border border-slate-700 text-slate-400 hover:text-white">
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-russo uppercase text-emerald-400">Validación de Pagos</h1>
                        <p className="text-slate-400 text-sm mt-1">Revisa y aprueba los comprobantes de pago de los usuarios.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 self-start md:self-center">
                    <Link
                        href="/super-admin?tab=transactions"
                        className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-xs font-bold text-emerald-400 uppercase hover:bg-slate-700 transition-colors flex items-center gap-2"
                    >
                        <Calendar size={14} />
                        Ver Historial Completo
                    </Link>
                    <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                        <span className="text-slate-400 text-xs uppercase font-bold">Pendientes:</span>
                        <span className="ml-2 text-xl font-bold text-white">{transactions?.length || 0}</span>
                    </div>
                </div>
            </header>

            {transactions?.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                    <Check className="text-emerald-500 mb-4" size={48} />
                    <h3 className="text-xl font-bold text-slate-300">¡Todo al día!</h3>
                    <p className="text-slate-500">No hay pagos pendientes por revisar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {transactions?.map((tx) => (
                        <div key={tx.id} className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden hover:border-slate-600 transition-all flex flex-col">
                            {/* Header Card */}
                            <div className="p-4 border-b border-slate-700 bg-slate-900/30 flex justify-between items-start">
                                <div>
                                    <p className="text-white font-bold text-sm truncate">{tx.user?.fullName || 'Usuario Desconocido'}</p>
                                    <p className="text-slate-400 text-xs font-mono">{tx.user?.email}</p>
                                    {/* League Info Badge */}
                                    {tx.league ? (
                                        <span className="inline-block mt-1 bg-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-500/30">
                                            LIGA: {tx.league.name}
                                        </span>
                                    ) : (
                                        <span className="inline-block mt-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                                            CUENTA USUARIO
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-bold font-mono">
                                        ${parseFloat(tx.amount.toString()).toLocaleString()}
                                    </p>
                                    <p className="text-[10px] text-slate-500 uppercase">{new Date(tx.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>

                            {/* Image Preview */}
                            <div className="relative h-48 bg-black/40 group overflow-hidden cursor-pointer" onClick={() => setSelectedImage(tx.imageUrl)}>
                                {tx.imageUrl ? (
                                    <>
                                        <img src={tx.imageUrl} alt="Comprobante" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                            <div className="opacity-0 group-hover:opacity-100 bg-black/70 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 backdrop-blur-sm transform translate-y-2 group-hover:translate-y-0 transition-all">
                                                <Search size={12} /> Ver Completa
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                                        <ImageIcon size={32} />
                                        <span className="text-xs mt-2">Sin Imagen</span>
                                    </div>
                                )}
                            </div>

                            {/* Info & Actions */}
                            <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs bg-slate-900 p-2 rounded-lg border border-slate-700/50">
                                        <span className="text-slate-500 font-bold">REFERENCIA:</span>
                                        <code className="text-slate-300 font-mono select-all flex items-center gap-1">
                                            {tx.referenceCode}
                                        </code>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-2">
                                    <button
                                        onClick={() => handleStatusUpdate(tx.id, 'REJECTED')}
                                        disabled={!!processingId}
                                        className="flex items-center justify-center gap-2 p-2 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-bold text-xs uppercase disabled:opacity-50"
                                    >
                                        <X size={16} /> Rechazar
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(tx.id, 'APPROVED')}
                                        disabled={!!processingId}
                                        className="flex items-center justify-center gap-2 p-2 rounded-xl bg-emerald-500 text-slate-900 font-bold text-xs uppercase hover:bg-emerald-400 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                                    >
                                        {processingId === tx.id ? (
                                            <div className="animate-spin w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full" />
                                        ) : (
                                            <>
                                                <Check size={16} /> Aprobar
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Image Modal */}
            {selectedImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-4 right-4 text-white hover:text-emerald-400 p-2 bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Comprobante Full"
                        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </div>
    );
}
