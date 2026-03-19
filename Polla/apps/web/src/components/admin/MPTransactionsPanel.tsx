"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    CreditCard, CheckCircle, XCircle, Clock, RefreshCw,
    Search, Zap, Building2, AlertCircle, ExternalLink
} from 'lucide-react';
import api from '@/lib/api';
import { superAdminService } from '@/services/superAdminService';

interface MPTransaction {
    id: string;
    amount: number;
    status: string;
    adminNotes?: string;
    createdAt: string;
    updatedAt: string;
    referenceCode: string;
    leagueId?: string;
    packageId?: string;
    imageUrl?: string;
    league?: {
        id: string;
        name: string;
        packageType: string;
        isPaid: boolean;
    };
    user?: {
        id: string;
        email: string;
        nickname?: string;
        fullName?: string;
    };
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
    PENDING_PAYMENT: {
        label: 'PAGO PENDIENTE (MP)',
        color: '#F97316',
        bg: 'rgba(249,115,22,0.1)',
        icon: <CreditCard size={12} />,
    },
    PENDING: {
        label: 'EN REVISIÓN',
        color: '#FACC15',
        bg: 'rgba(250,204,21,0.1)',
        icon: <Clock size={12} />,
    },
    APPROVED: {
        label: 'APROBADO',
        color: '#00E676',
        bg: 'rgba(0,230,118,0.1)',
        icon: <CheckCircle size={12} />,
    },
    PAID: {
        label: 'PAGADO',
        color: '#00E676',
        bg: 'rgba(0,230,118,0.1)',
        icon: <CheckCircle size={12} />,
    },
    REJECTED: {
        label: 'RECHAZADO',
        color: '#EF4444',
        bg: 'rgba(239,68,68,0.1)',
        icon: <XCircle size={12} />,
    },
};

export function MPTransactionsPanel({ tournamentId }: { tournamentId?: string }) {
    const [transactions, setTransactions] = useState<MPTransaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING_PAYMENT');
    const [activating, setActivating] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await superAdminService.getAllTransactions(tournamentId);
            const all: MPTransaction[] = Array.isArray(data) ? data : (data?.data || []);
            // Filtramos solo MP: transacciones sin imageUrl (no son manuales) y con estado de pago
            const mpTx = all.filter(tx =>
                !tx.imageUrl &&
                ['PENDING_PAYMENT', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'].includes(tx.status)
            );
            setTransactions(mpTx.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            ));
        } catch (e) {
            console.error('Error cargando transacciones MP:', e);
        } finally {
            setLoading(false);
        }
    }, [tournamentId]);

    useEffect(() => { load(); }, [load]);

    const handleActivate = async (tx: MPTransaction) => {
        if (!confirm(`¿Activar manualmente la polla "${tx.league?.name || tx.leagueId}" para ${tx.user?.email}? \n\nMonto: $${Number(tx.amount).toLocaleString('es-CO')} COP`)) return;
        setActivating(tx.id);
        setSuccessMsg(null);
        setErrorMsg(null);
        try {
            await superAdminService.approveTransaction(tx.id);
            setSuccessMsg(`✅ Liga "${tx.league?.name || 'sin nombre'}" activada correctamente.`);
            await load();
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.message || 'Error al activar la liga.');
        } finally {
            setActivating(null);
        }
    };

    const handleReject = async (tx: MPTransaction) => {
        if (!confirm(`¿Rechazar el pago de ${tx.user?.email}?`)) return;
        try {
            await api.patch(`/transactions/${tx.id}/status`, {
                status: 'REJECTED',
                adminNotes: 'Rechazado manualmente desde panel Super Admin',
            });
            setSuccessMsg('Pago rechazado.');
            await load();
        } catch (e: any) {
            setErrorMsg(e?.response?.data?.message || 'Error al rechazar.');
        }
    };

    const filtered = transactions.filter(tx => {
        const matchStatus = statusFilter === 'ALL' || tx.status === statusFilter;
        const q = search.toLowerCase();
        const matchSearch = !q ||
            tx.user?.email?.toLowerCase().includes(q) ||
            tx.user?.nickname?.toLowerCase().includes(q) ||
            tx.league?.name?.toLowerCase().includes(q) ||
            tx.referenceCode?.toLowerCase().includes(q);
        return matchStatus && matchSearch;
    });

    const pendingMPCount = transactions.filter(t => t.status === 'PENDING_PAYMENT' || t.status === 'PENDING').length;

    return (
        <div className="space-y-4">
            {/* HEADER */}
            <div className="bg-[#1E293B] border border-orange-500/30 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-start md:items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <CreditCard size={20} className="text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-white font-black uppercase text-sm tracking-wider">
                            Pagos Mercado Pago
                        </h2>
                        <p className="text-slate-400 text-xs">
                            {pendingMPCount > 0
                                ? <span className="text-orange-400 font-bold">{pendingMPCount} pago(s) requieren atención</span>
                                : 'Todos los pagos están al día'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={load}
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors border border-slate-600"
                >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Actualizar
                </button>
            </div>

            {/* ALERTAS */}
            {successMsg && (
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
                    <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-emerald-300 text-sm font-bold">{successMsg}</p>
                    <button onClick={() => setSuccessMsg(null)} className="ml-auto text-emerald-500 hover:text-white">✕</button>
                </div>
            )}
            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
                    <p className="text-red-300 text-sm font-bold">{errorMsg}</p>
                    <button onClick={() => setErrorMsg(null)} className="ml-auto text-red-500 hover:text-white">✕</button>
                </div>
            )}

            {/* FILTROS */}
            <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Buscar por email, liga, referencia..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#0F172A] border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-orange-400 transition-all"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#0F172A] border border-slate-700 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-orange-400 transition-all"
                >
                    <option value="ALL">TODOS LOS ESTADOS</option>
                    <option value="PENDING_PAYMENT">⚠️ PAGO PENDIENTE (MP)</option>
                    <option value="PENDING">🕐 EN REVISIÓN</option>
                    <option value="APPROVED">✅ APROBADO</option>
                    <option value="PAID">✅ PAGADO</option>
                    <option value="REJECTED">❌ RECHAZADO</option>
                </select>
            </div>

            {/* TABLA */}
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-orange-400" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-slate-700 rounded-xl">
                    <CreditCard size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 font-bold">No hay transacciones con estos filtros.</p>
                    {statusFilter === 'PENDING_PAYMENT' && (
                        <p className="text-slate-500 text-xs mt-2">¡Bien! No hay pagos de MP pendientes de activación.</p>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map(tx => {
                        const cfg = STATUS_CONFIG[tx.status] || STATUS_CONFIG['PENDING'];
                        const isPending = tx.status === 'PENDING_PAYMENT' || tx.status === 'PENDING';
                        return (
                            <div
                                key={tx.id}
                                className="bg-[#1E293B] rounded-xl p-4 border transition-all"
                                style={{
                                    borderColor: isPending ? cfg.color + '60' : '#334155',
                                    backgroundColor: isPending ? cfg.bg : '#1E293B',
                                }}
                            >
                                <div className="flex flex-col md:flex-row gap-4">
                                    {/* INFO PRINCIPAL */}
                                    <div className="flex-1 space-y-2">
                                        {/* Status badge */}
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span
                                                className="flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider"
                                                style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}40` }}
                                            >
                                                {cfg.icon} {cfg.label}
                                            </span>
                                            {tx.adminNotes?.includes('MP') || tx.adminNotes?.includes('Mercado') || !tx.imageUrl ? (
                                                <span className="text-[9px] bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full font-bold uppercase">
                                                    💳 Mercado Pago
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Usuario */}
                                        <div>
                                            <p className="text-white font-bold text-sm">
                                                {tx.user?.nickname || tx.user?.fullName || tx.user?.email || 'Usuario desconocido'}
                                            </p>
                                            <p className="text-slate-400 text-xs">{tx.user?.email}</p>
                                        </div>

                                        {/* Liga */}
                                        {tx.league && (
                                            <div className="flex items-center gap-2">
                                                <Building2 size={12} className="text-slate-500" />
                                                <span className="text-slate-300 text-xs">
                                                    <span className="font-bold text-white">{tx.league.name}</span>
                                                    <span className="ml-1 text-slate-500">({tx.league.packageType?.toUpperCase()})</span>
                                                    {tx.league.isPaid
                                                        ? <span className="ml-2 text-emerald-400 font-bold text-[9px] uppercase">✓ Ya activa</span>
                                                        : <span className="ml-2 text-orange-400 font-bold text-[9px] uppercase">⚠ Sin activar</span>
                                                    }
                                                </span>
                                            </div>
                                        )}

                                        {/* Referencia y fecha */}
                                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                                            <span>Ref: <code className="text-slate-400">{tx.referenceCode}</code></span>
                                            <span>{new Date(tx.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span>
                                        </div>

                                        {/* Notas del admin */}
                                        {tx.adminNotes && (
                                            <p className="text-[10px] text-slate-500 italic border-l-2 border-slate-600 pl-2">
                                                {tx.adminNotes}
                                            </p>
                                        )}
                                    </div>

                                    {/* MONTO Y ACCIONES */}
                                    <div className="flex flex-col items-end justify-between gap-3 min-w-[140px]">
                                        <p className="text-2xl font-black text-[#00E676]">
                                            ${Number(tx.amount).toLocaleString('es-CO')}
                                        </p>

                                        {/* Botones de acción */}
                                        <div className="flex flex-col gap-2 w-full">
                                            {isPending && tx.league && !tx.league.isPaid && (
                                                <button
                                                    onClick={() => handleActivate(tx)}
                                                    disabled={activating === tx.id}
                                                    className="flex items-center justify-center gap-2 bg-[#00E676] hover:bg-emerald-400 text-[#0F172A] font-black text-xs py-2 px-4 rounded-lg transition-all disabled:opacity-60"
                                                >
                                                    {activating === tx.id
                                                        ? <RefreshCw size={12} className="animate-spin" />
                                                        : <Zap size={12} />
                                                    }
                                                    ACTIVAR LIGA
                                                </button>
                                            )}
                                            {isPending && tx.league && tx.league.isPaid && (
                                                <div className="flex items-center justify-center gap-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px] py-2 px-3 rounded-lg">
                                                    <CheckCircle size={12} />
                                                    Liga ya activa
                                                </div>
                                            )}
                                            {isPending && (
                                                <button
                                                    onClick={() => handleReject(tx)}
                                                    className="flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-[10px] py-2 px-3 rounded-lg transition-all"
                                                >
                                                    <XCircle size={12} />
                                                    Rechazar
                                                </button>
                                            )}
                                            {tx.status === 'APPROVED' && tx.league && !tx.league.isPaid && (
                                                <button
                                                    onClick={() => handleActivate(tx)}
                                                    disabled={activating === tx.id}
                                                    className="flex items-center justify-center gap-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-400 font-bold text-[10px] py-2 px-3 rounded-lg transition-all disabled:opacity-60"
                                                >
                                                    <Zap size={12} />
                                                    Forzar Activación
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* RESUMEN STATS */}
            {transactions.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
                    {[
                        { label: 'Pendientes MP', count: transactions.filter(t => t.status === 'PENDING_PAYMENT').length, color: '#F97316' },
                        { label: 'En Revisión', count: transactions.filter(t => t.status === 'PENDING').length, color: '#FACC15' },
                        { label: 'Aprobados', count: transactions.filter(t => t.status === 'APPROVED' || t.status === 'PAID').length, color: '#00E676' },
                        { label: 'Rechazados', count: transactions.filter(t => t.status === 'REJECTED').length, color: '#EF4444' },
                    ].map(stat => (
                        <div key={stat.label} className="bg-[#1E293B] border border-slate-700 rounded-xl p-3 text-center">
                            <p className="text-2xl font-black" style={{ color: stat.color }}>{stat.count}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{stat.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
