"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import Link from 'next/link';
import {
    Users, Trophy, Banknote, TrendingUp, ShieldAlert,
    CheckCircle, ChevronRight, LayoutDashboard, Shield, Download,
    Share2, Instagram, Facebook, MessageCircle, Music2, Mail, Save, HelpCircle, Eye, FileText,
    Building2, Rocket, Gift, Calendar, Filter, Search, X, Image as ImageIcon,
    ListOrdered, CreditCard, Tv, Store, ShoppingCart, Clock
} from 'lucide-react';
import { superAdminService } from '@/services/superAdminService';
import { BonusQuestionsTable } from '@/components/admin/BonusQuestionsTable';
import { UsersTable } from '@/components/admin/UsersTable';
import { LeaguesTable } from '@/components/admin/LeaguesTable';
import { MatchesList } from '@/components/admin/MatchesList';
import { MatchAdminPanel } from '@/components/admin/MatchAdminPanel';
import { CreateEnterpriseLeagueForm } from '@/components/admin/CreateEnterpriseLeagueForm';
import { GroupStandingsOverride } from '@/components/admin/GroupStandingsOverride';
import { CommunicationPanel } from '@/components/admin/CommunicationPanel';
import { BroadcastTab } from '@/components/admin/BroadcastTab';
import { TournamentHeader } from '@/components/admin/TournamentHeader';
import { Megaphone } from 'lucide-react';
import { MainHeader } from '@/components/MainHeader';
import PlatformDashboard from '@/components/admin/PlatformDashboard';
import { MPTransactionsPanel } from '@/components/admin/MPTransactionsPanel';

/* =============================================================================
   DATOS MOCK
   ============================================================================= */

// SISTEMA DE DISEÑO BLINDADO
const STYLES = {
    container: {
        backgroundColor: '#0F172A', // Obsidian
        minHeight: '100vh',
        padding: '0px',
        paddingBottom: '100px',
        color: 'white',
        fontFamily: 'sans-serif'
    },
    contentWrapper: {
        padding: '16px',
        paddingTop: '0px'
    },
    // HEADER
    header: {
        marginBottom: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    titleBox: { display: 'flex', flexDirection: 'column' as const },
    title: {
        fontFamily: "'Russo One', sans-serif",
        fontSize: '20px',
        textTransform: 'uppercase' as const,
        lineHeight: '1',
        marginBottom: '4px'
    },
    subtitle: {
        fontSize: '10px',
        color: '#94A3B8',
        fontWeight: 'bold',
        letterSpacing: '1px',
        textTransform: 'uppercase' as const
    },
    systemBadge: {
        backgroundColor: 'rgba(0, 230, 118, 0.1)',
        border: '1px solid #00E676',
        color: '#00E676',
        fontSize: '9px',
        fontWeight: '900',
        padding: '4px 8px',
        borderRadius: '6px',
        letterSpacing: '1px'
    },

    // MENÚ DE PESTAÑAS (PILL STYLE)
    tabsContainer: {
        display: 'flex',
        backgroundColor: '#1E293B',
        padding: '4px',
        borderRadius: '12px',
        gap: '4px',
        marginBottom: '24px',
        overflowX: 'auto' as const
    },
    tab: {
        flex: 1,
        padding: '10px',
        borderRadius: '8px',
        border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
        fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' as const,
        cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' as const
    },
    activeTab: { backgroundColor: '#00E676', color: '#0F172A', boxShadow: '0 2px 10px rgba(0,230,118,0.2)' },
    inactiveTab: { backgroundColor: 'transparent', color: '#94A3B8' },

    // TARJETAS KPI
    kpiGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '12px',
        marginBottom: '24px'
    },
    kpiCard: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        padding: '16px',
        border: '1px solid #334155',
        position: 'relative' as const,
        overflow: 'hidden'
    },
    kpiHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '8px',
        fontSize: '10px',
        fontWeight: 'bold',
        color: '#94A3B8',
        textTransform: 'uppercase' as const
    },
    kpiValue: {
        fontFamily: "'Russo One', sans-serif",
        fontSize: '24px',
        color: 'white',
        lineHeight: '1'
    },
    kpiLabel: {
        fontSize: '10px',
        color: '#64748B',
        fontWeight: 'bold',
        marginTop: '4px'
    },

    // GRÁFICA
    chartCard: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #334155',
        padding: '16px',
        marginBottom: '24px'
    },
    chartTitle: {
        fontSize: '12px',
        fontWeight: '900',
        color: 'white',
        marginBottom: '16px',
        textTransform: 'uppercase' as const,
        display: 'flex', alignItems: 'center', gap: '8px'
    },

    // LISTA DE TRANSACCIONES
    txCard: {
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        border: '1px solid #334155',
        padding: '16px',
        marginBottom: '12px',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: '12px'
    },
    txInfoRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    txInfo: {
        display: 'flex',
        flexDirection: 'column' as const
    },
    txUser: { fontSize: '13px', fontWeight: 'bold', color: 'white' },
    txDate: { fontSize: '10px', color: '#94A3B8' },
    txValue: { fontFamily: "'Russo One', sans-serif", fontSize: '16px', color: '#00E676' },
    planBadge: {
        fontSize: '9px',
        fontWeight: '900',
        padding: '2px 6px',
        borderRadius: '4px',
        textTransform: 'uppercase' as const,
        marginLeft: '8px'
    },
    // BOTÓN DESCARGAR VOUCHER
    voucherBtn: {
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px dashed #475569',
        borderRadius: '8px',
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 'bold',
        padding: '10px',
        width: '100%',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        textTransform: 'uppercase' as const,
        transition: 'all 0.2s'
    }
};
export default function SuperAdminDashboard() {
    const searchParams = useSearchParams();
    const tournamentId = searchParams.get('tournamentId') || 'WC2026';
    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, transactions
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, PAID
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    // Real Data State
    const [stats, setStats] = useState({
        kpis: { totalIncome: 0, activeLeagues: 0, totalUsers: 0, todaySales: 0, freeLeagues: 0 },
        salesTrend: [],
        recentTransactions: [],
        users: [],
        leagues: []
    });

    const [settingsForm, setSettingsForm] = useState<any>({});
    const [tieBreakerOverride, setTieBreakerOverride] = useState<string>('');
    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab) setActiveTab(tab);
    }, [searchParams]);

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(() => {
            loadDashboardData(true);
        }, 30000); // 30 seconds refresh for admin
        return () => clearInterval(interval);
    }, [tournamentId]); // Refresh when tournamentId changes

    const loadDashboardData = async (isBackground = false) => {
        try {
            if (!isBackground) setLoading(true);
            
            // Only fetch settings on initial load (not on background refresh)
            const promises: any[] = [superAdminService.getDashboardStats(tournamentId)];
            if (!isBackground) {
                promises.push(superAdminService.getSettings());
                promises.push(superAdminService.getSystemConfig(`override_tie_breaker_goals_${tournamentId}`));
            }

            const [dashboardData, settingsData, overrideData] = await Promise.all(promises);
            
            setStats(dashboardData as any);
            
            // Only update settings form if we fetched it (initial load)
            if (settingsData) {
                setSettingsForm(settingsData);
            }
            if (overrideData && overrideData.value) {
                setTieBreakerOverride(overrideData.value);
            }
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            // Remove 'id' if present to avoid 400 Bad Request
            const payload = { ...settingsForm };
            delete payload.id;
            
            await superAdminService.updateSettings(payload);
            
            if (tieBreakerOverride !== '') {
               await superAdminService.updateSystemConfig(`override_tie_breaker_goals_${tournamentId}`, tieBreakerOverride);
            }

            alert("Configuración guardada correctamente");
        } catch (error: any) {
            console.error("Error saving settings:", error);
            alert(error.response?.data?.message || "Error al guardar la configuración");
        }
    };

    // Download Logic
    const handleDownloadVoucher = async (txId: string) => {
        try {
            await superAdminService.downloadVoucher(txId);
        } catch (error) {
            console.error("Error downloading voucher:", error);
            alert("Error al descargar el voucher. Intente nuevamente.");
        }
    };

    // Format Currency
    const formatCurrency = (amount: number) => {
        return `$ ${amount.toLocaleString('es-CO')}`;
    };

    // Format Large Numbers
    const formatCompact = (num: number) => {
        return new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(num);
    };

    const translateStatus = (status: string) => {
        const map: any = {
            'PENDING': 'PENDIENTE',
            'COMPLETED': 'COMPLETADO',
            'PAID': 'PAGADO',
            'FAILED': 'FALLIDO',
            'APPROVED': 'APROBADO'
        };
        return map[status] || status;
    };

    const pendingCount = stats.recentTransactions.filter((tx: any) => tx.status === 'PENDING').length;
    const pendingMPCount = stats.recentTransactions.filter((tx: any) => tx.status === 'PENDING_PAYMENT' && !tx.imageUrl).length;

    const KPI_DATA_REAL = [
        { title: "Ingresos Totales", value: formatCompact(stats.kpis.totalIncome), label: "COP", icon: Banknote, color: "#00E676" },
        { title: "Pollas Activas", value: stats.kpis.activeLeagues, label: "Torneos", icon: Trophy, color: "#FACC15" },
        { title: "Pollas Gratis", value: (stats.kpis as any).freeLeagues || 0, label: "Sin Pago", icon: Gift, color: "#38BDF8" },
        { title: "Ventas Hoy", value: formatCurrency(stats.kpis.todaySales), label: "COP", icon: TrendingUp, color: "#00E676", isSpecial: true }
    ];

    if (loading) {
        return (
            <div style={STYLES.container} className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
            </div>
        );
    }

    return (
        <div style={STYLES.container}>
            <MainHeader />
            
            <div style={STYLES.contentWrapper}>
                {/* 1. HEADER */}
                <TournamentHeader tournamentId={tournamentId} />

            {/* 2. MENÚ DE PESTAÑAS (PILL TABS) */}
            <div style={STYLES.tabsContainer} className="no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Resumen', icon: <LayoutDashboard size={14} /> },
                    { id: 'match-admin', label: '🎯 Polla Match', icon: <Store size={14} /> },
                    { id: 'users', label: 'Usuarios', icon: <Eye size={14} /> },
                    { id: 'leagues', label: 'Pollas', icon: <Trophy size={14} /> },
                    { id: 'matches', label: 'Partidos', icon: <Shield size={14} /> },
                    { id: 'standings', label: 'Posiciones', icon: <ListOrdered size={14} /> },
                    { id: 'questions', label: 'Preguntas', icon: <HelpCircle size={14} /> },
                    { id: 'transactions', label: 'Ventas', icon: <Banknote size={14} />, badge: pendingCount },
                    { id: 'mp-payments', label: 'Pagos MP', icon: <CreditCard size={14} />, badge: pendingMPCount },
                    { id: 'communication', label: 'Difusión', icon: <Megaphone size={14} /> },
                    // { id: 'enterprise', label: 'Empresas B2B', icon: <Building2 size={14} /> },
                    { id: 'settings', label: 'Redes Sociales', icon: <Share2 size={14} /> },
                    { id: 'match-purchases', label: 'Compras Match', icon: <ShoppingCart size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ ...STYLES.tab, ...(activeTab === tab.id ? STYLES.activeTab : STYLES.inactiveTab), position: 'relative' }}
                    >
                        {tab.icon} {tab.label}
                        {tab.badge && tab.badge > 0 && (
                            <span style={{
                                backgroundColor: '#EF4444',
                                color: 'white',
                                fontSize: '8px',
                                padding: '2px 5px',
                                borderRadius: '10px',
                                marginLeft: '4px',
                                fontWeight: 'bold'
                            }}>
                                {tab.badge}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* G. PESTAÑA PREGUNTAS */}
            {activeTab === 'questions' && (
                <BonusQuestionsTable tournamentId={tournamentId} />
            )}

            {activeTab === 'standings' && <GroupStandingsOverride tournamentId={tournamentId} />}

            {/* --- CONTENIDO DINÁMICO --- */}

            {/* A. PESTAÑA DASHBOARD — PlatformDashboard */}
            {activeTab === 'dashboard' && <PlatformDashboard tournamentId={tournamentId} />}

            {/* NUEVA: PESTAÑA POLLA MATCH — Gestión de Bares */}
            {activeTab === 'match-admin' && <MatchAdminTab leagues={stats.leagues} onRefresh={loadDashboardData} />}

            {/* H. PESTAÑA EMPRESAS (NUEVO) */}


            {showEnterpriseModal && (
                <CreateEnterpriseLeagueForm
                    onClose={() => setShowEnterpriseModal(false)}
                    onSuccess={() => {
                        loadDashboardData();
                        setShowEnterpriseModal(false);
                    }}
                />
            )}

            {/* B. PESTAÑA USUARIOS (OJO DE DIOS) */}
            {activeTab === 'users' && <UsersTable tournamentId={tournamentId} />}

            {/* E. PESTAÑA LIGAS - REEMPLAZADO POR LeaguesTable */}
            {activeTab === 'leagues' && <LeaguesTable tournamentId={tournamentId} onDataUpdated={loadDashboardData} onCreateEnterprise={() => setShowEnterpriseModal(true)} />}

            {/* F. PESTAÑA PARTIDOS - NUEVO COMPONENTE */}
            {activeTab === 'matches' && <MatchesList tournamentId={tournamentId} />}

            {/* C. PESTAÑA VENTAS (TRANSACCIONES) */}
            {
                activeTab === 'transactions' && (
                    <div className="space-y-4">
                        {/* 1. BARRA DE FILTROS */}

                        <div className="bg-[#1E293B] border border-slate-700 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
                            <div className="flex items-center gap-2 text-white font-bold uppercase text-xs">
                                <Filter size={16} className="text-[#00E676]" /> Historial de Ventas ({tournamentId})
                                <Link href="/admin/transactions" className="ml-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/50 px-3 py-1 rounded-lg hover:bg-emerald-500 hover:text-slate-900 transition-colors flex items-center gap-2">
                                    <ShieldAlert size={12} />
                                    Verificar Comprobantes (Fotos)
                                </Link>
                            </div>
                            <div className="flex gap-3 items-end w-full md:w-auto flex-wrap">
                                <div className="flex flex-col gap-1 flex-1 min-w-[120px]">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Estado</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="bg-[#0F172A] border border-slate-700 rounded-lg py-2 px-3 text-xs text-white outline-none focus:border-[#00E676] w-full transition-all appearance-none"
                                    >
                                        <option value="ALL">TODOS</option>
                                        <option value="PENDING">PENDIENTES</option>
                                        <option value="PAID">PAGADOS</option>
                                        <option value="REJECTED">RECHAZADOS</option>
                                    </select>
                                </div>

                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Desde</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="date"
                                            className="bg-[#0F172A] border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#00E676] w-full transition-all"
                                            value={dateFilter.start}
                                            onChange={(e) => setDateFilter({ ...dateFilter, start: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1 flex-1">
                                    <label className="text-[10px] text-slate-400 font-bold uppercase ml-1">Hasta</label>
                                    <div className="relative">
                                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            type="date"
                                            className="bg-[#0F172A] border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-[#00E676] w-full transition-all"
                                            value={dateFilter.end}
                                            onChange={(e) => setDateFilter({ ...dateFilter, end: e.target.value })}
                                        />
                                    </div>
                                </div>
                                {(dateFilter.start || dateFilter.end || statusFilter !== 'ALL') && (
                                    <button
                                        onClick={() => {
                                            setDateFilter({ start: '', end: '' });
                                            setStatusFilter('ALL');
                                        }}
                                        className="h-[34px] px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold transition-colors border border-slate-700"
                                    >
                                        Limpiar
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* 2. TARJETA RESUMEN DEL FILTRO */}
                        <div className="bg-gradient-to-r from-[#1E293B] to-[#0F172A] border border-slate-700 rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-5">
                                <Banknote size={100} />
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2 z-10">Total Ventas (Periodo Seleccionado)</p>
                            <p className="text-4xl font-russo text-[#00E676] z-10 drop-shadow-lg">
                                {formatCurrency(stats.recentTransactions
                                    .filter((tx: any) => {
                                        // NUNCA sumar dinero de transacciones que no estén aprobadas/pagadas
                                        if (tx.status !== 'APPROVED' && tx.status !== 'PAID') return false;

                                        if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
                                            if (statusFilter === 'PAID' && (tx.status === 'APPROVED' || tx.status === 'PAID')) {
                                                // Allow APPROVED as PAID
                                            } else {
                                                return false;
                                            }
                                        }
                                        if (!dateFilter.start && !dateFilter.end) return true;
                                        const txDate = new Date(tx.createdAt).toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
                                        if (dateFilter.start && txDate < dateFilter.start) return false;
                                        if (dateFilter.end && txDate > dateFilter.end) return false;
                                        return true;
                                    })
                                    .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0)
                                )}
                            </p>
                        </div>

                        {/* LISTA FILTRADA */}
                        <div>
                            {stats.recentTransactions.filter((tx: any) => {
                                if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
                                    if (statusFilter === 'PAID' && (tx.status === 'APPROVED' || tx.status === 'PAID')) {
                                        // Allow
                                    } else {
                                        return false;
                                    }
                                }
                                if (!dateFilter.start && !dateFilter.end) return true;
                                const txDate = new Date(tx.createdAt).toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
                                if (dateFilter.start && txDate < dateFilter.start) return false;
                                if (dateFilter.end && txDate > dateFilter.end) return false;
                                return true;
                            }).length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#64748B', padding: '40px', border: '1px dashed #334155', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Banknote size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                                    <p>No hay ventas registradas con estos filtros.</p>
                                    <button
                                        onClick={() => loadDashboardData(false)}
                                        style={{ marginTop: '16px', backgroundColor: 'transparent', border: '1px solid #334155', color: '#94A3B8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}
                                    >
                                        Refrescar Datos
                                    </button>
                                </div>
                            ) : (
                                stats.recentTransactions
                                    .filter((tx: any) => {
                                        if (statusFilter !== 'ALL' && tx.status !== statusFilter) {
                                            if (statusFilter === 'PAID' && (tx.status === 'APPROVED' || tx.status === 'PAID')) {
                                                // Allow
                                            } else {
                                                return false;
                                            }
                                        }
                                        if (!dateFilter.start && !dateFilter.end) return true;
                                        const txDate = new Date(tx.createdAt).toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' });
                                        if (dateFilter.start && txDate < dateFilter.start) return false;
                                        if (dateFilter.end && txDate > dateFilter.end) return false;
                                        return true;
                                    })
                                    .sort((a: any, b: any) => {
                                        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                                        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                                        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                                    })
                                    .slice(0, 50) // Limit to 50 for performance
                                    .map((tx: any) => (
                                        <div key={tx.id} style={{
                                            ...STYLES.txCard,
                                            border: tx.status === 'PENDING' ? '1px solid #FACC15' : '1px solid #334155',
                                            backgroundColor: tx.status === 'PENDING' ? 'rgba(250, 204, 21, 0.05)' : '#1E293B'
                                        }}>

                                            {/* INFO SUPERIOR */}
                                            <div style={STYLES.txInfoRow}>
                                                <div style={STYLES.txInfo}>
                                                    <span style={STYLES.txUser}>
                                                        {tx.user?.nickname || tx.user?.email || 'Usuario'}
                                                        <span style={{
                                                            ...STYLES.planBadge,
                                                            backgroundColor: 'rgba(250, 204, 21, 0.1)', // Default gold for now
                                                            color: '#FACC15',
                                                            textTransform: 'uppercase'
                                                        }}>
                                                            {(() => {
                                                                const raw = tx.packageType || tx.packageId || tx.league?.packageType || '';
                                                                const upper = raw.toString().toUpperCase();
                                                                const map: Record<string, string> = {
                                                                    'BUSINESS_STARTER': 'EMPRENDEDOR (LEGACY)',
                                                                    'BUSINESS_PRO': 'EMPRESARIAL (LEGACY)',
                                                                    'ENTERPRISE_BRONZE': 'BRONCE',
                                                                    'ENTERPRISE_SILVER': 'PLATA',
                                                                    'ENTERPRISE_GOLD': 'ORO',
                                                                    'ENTERPRISE_PLATINUM': 'PLATINO',
                                                                    'ENTERPRISE_DIAMOND': 'DIAMANTE',
                                                                    'STARTER': 'PARCHE',
                                                                    'AMATEUR': 'PARCHE',
                                                                    'AMIGOS': 'AMIGOS',
                                                                    'SEMI-PRO': 'AMIGOS',
                                                                    'PRO': 'LIDER',
                                                                    'LIDER': 'LIDER',
                                                                    'ELITE': 'INFLUENCER',
                                                                    'INFLUENCER': 'INFLUENCER'
                                                                };
                                                                return `PLAN: ${map[upper] || upper}`;
                                                            })()}
                                                        </span>
                                                    </span>
                                                    <span style={STYLES.txDate}>{new Date(tx.createdAt).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</span>
                                                    {tx.league && (
                                                        <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                                                            Liga: {tx.league.name}
                                                            {tx.league.adminPhone && (
                                                                <span style={{ display: 'block', color: '#00E676', fontWeight: 'bold', marginTop: '2px' }}>
                                                                    WP: {tx.league.adminPhone} {tx.league.adminName ? `(${tx.league.adminName})` : ''}
                                                                </span>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={STYLES.txValue}>{formatCurrency(Number(tx.amount))}</div>
                                                    <div style={{ fontSize: '9px', color: tx.status === 'PENDING' ? '#FACC15' : '#00E676', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px', fontWeight: 'bold' }}>
                                                        {tx.status === 'PENDING' ? <ShieldAlert size={10} /> : <CheckCircle size={10} />} {translateStatus(tx.status)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* ACCIONES */}
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                {tx.status === 'PENDING' && (
                                                    <button
                                                        onClick={async () => {
                                                            if (confirm("¿Confirmar que recibió el pago? Esto activará el plan para la liga.")) {
                                                                try {
                                                                    await superAdminService.approveTransaction(tx.id);
                                                                    alert("Pago aprobado y plan activado.");
                                                                    loadDashboardData();
                                                                } catch (e) {
                                                                    console.error(e);
                                                                    alert("Error al aprobar pago.");
                                                                }
                                                            }
                                                        }}
                                                        style={{
                                                            flex: 1,
                                                            backgroundColor: '#00E676',
                                                            border: 'none',
                                                            borderRadius: '8px',
                                                            color: '#0F172A',
                                                            fontSize: '11px',
                                                            fontWeight: 'bold',
                                                            padding: '10px',
                                                            cursor: 'pointer',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                                                        }}
                                                    >
                                                        <CheckCircle size={14} /> APROBAR PAGO
                                                    </button>
                                                )}



                                                {tx.imageUrl && (
                                                    <button
                                                        onClick={() => setSelectedImage(tx.imageUrl)}
                                                        style={{ ...STYLES.voucherBtn, color: 'white', borderColor: '#334155', backgroundColor: '#334155' }}
                                                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#475569'; }}
                                                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#334155'; }}
                                                    >
                                                        <ImageIcon size={14} /> Ver Foto
                                                    </button>
                                                )}

                                                <button
                                                    style={STYLES.voucherBtn}
                                                    onClick={() => handleDownloadVoucher(tx.id)}
                                                    onMouseEnter={(e) => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                                                    onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#475569'; }}
                                                >
                                                    <Download size={14} /> Voucher
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            )}
                        </div>
                    </div>
                )
            }

            {/* D. PESTAÑA REDES SOCIALES (SETTINGS) */}
            {
                activeTab === 'settings' && (
                    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                        <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '24px', border: '1px solid #334155' }}>
                            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Share2 size={20} color="#00E676" /> Configuración de Redes
                            </h2>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {[
                                    { key: 'instagram', label: 'Instagram URL', icon: <Instagram size={16} /> },
                                    { key: 'facebook', label: 'Facebook URL', icon: <Facebook size={16} /> },
                                    { key: 'whatsapp', label: 'WhatsApp URL', icon: <MessageCircle size={16} /> },
                                    { key: 'tiktok', label: 'TikTok URL', icon: <Music2 size={16} /> },
                                    { key: 'support', label: 'Email Soporte', icon: <Mail size={16} /> },
                                    { key: 'copyright', label: 'Copyright Text', icon: <FileText size={16} /> }
                                ].map((field) => (
                                    <div key={field.key}>
                                        <label style={{ color: '#94A3B8', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {field.icon} {field.label}
                                        </label>
                                        <input
                                            type="text"
                                            value={settingsForm[field.key] || ''}
                                            onChange={(e) => setSettingsForm({ ...settingsForm, [field.key]: e.target.value })}
                                            style={{ width: '100%', padding: '12px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontSize: '13px' }}
                                            placeholder={`Ingrese ${field.label}`}
                                        />
                                    </div>
                                ))}

                                <hr style={{ borderColor: '#334155', margin: '16px 0' }} />
                                
                                <div>
                                    <label style={{ color: '#00E676', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Trophy size={16} /> Configuración de Desempate (Goles Totales del Torneo)
                                    </label>
                                    <p style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '8px' }}>
                                        Este valor determina los goles totales reales para definir a los ganadores en caso de empate. Si se deja en blanco, el sistema calculará la suma automáticamente de los partidos finalizados.
                                    </p>
                                    <input
                                        type="number"
                                        value={tieBreakerOverride || ''}
                                        onChange={(e) => setTieBreakerOverride(e.target.value)}
                                        style={{ width: '100%', padding: '12px', backgroundColor: '#0F172A', border: '1px solid #00E676', borderRadius: '8px', color: 'white', fontSize: '13px', outline: 'none' }}
                                        placeholder={`Total de goles manual del torneo`}
                                    />
                                </div>

                                <button
                                    onClick={handleSaveSettings}
                                    style={{
                                        marginTop: '16px',
                                        padding: '14px',
                                        backgroundColor: '#00E676',
                                        border: 'none',
                                        borderRadius: '12px',
                                        color: '#0F172A',
                                        fontWeight: 'bold',
                                        fontSize: '14px',
                                        cursor: 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                                    }}
                                >
                                    <Save size={18} /> GUARDAR CAMBIOS
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* I Nueva. PESTAÑA PAGOS MERCADO PAGO */}
            {activeTab === 'mp-payments' && (
                <MPTransactionsPanel tournamentId={tournamentId} />
            )}

            {/* J. PESTAÑA COMUNICACIÓN */}
            {activeTab === 'communication' && <BroadcastTab tournamentId={tournamentId} />}

            {/* K. PESTAÑA COMPRAS MATCH */}
            {activeTab === 'match-purchases' && <MatchPurchasesAdminTab />}

            {/* Image Modal for Transactions */}
            {selectedImage && (
                <div
                    style={{
                        position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(4px)', padding: '20px'
                    }}
                    onClick={() => setSelectedImage(null)}
                >
                    <button
                        style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', background: 'transparent', border: 'none', cursor: 'pointer' }}
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={32} />
                    </button>
                    <img
                        src={selectedImage}
                        alt="Comprobante"
                        style={{ maxWidth: '100%', maxHeight: '90vh', borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
            </div>
        </div>
    );
}

function MatchAdminTab({ leagues, onRefresh }: { leagues: any[], onRefresh: () => void }) {
    // Filtrar solo las pollas que son de tipo bar/empresa que podrían usar match mode
    // (Por ahora permitimos a todas las que son enterprise o pagadas)
    const matchLeagues = leagues.filter(l => l.packageType?.includes('ENTERPRISE') || l.type === 'COMPANY' || l.isPaid);

    return (
        <div className="space-y-6">
            <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-russo uppercase text-white mb-2 flex items-center gap-2">
                    <Store className="text-emerald-500" /> Panel Global Polla Match
                </h2>
                <p className="text-slate-400 text-sm">Gestiona todos los bares y eventos corporativos que utilizan el modo "1 Partido a la vez".</p>
            </div>

            <div className="grid gap-6">
                {matchLeagues.map(league => (
                    <div key={league.id} className={`bg-[#1E293B] border ${league.isMatchMode ? 'border-emerald-500/50' : 'border-slate-700'} rounded-xl p-6 overflow-hidden relative`}>
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white uppercase flex items-center gap-2">
                                    {league.companyName || league.name}
                                    {league.isMatchMode && <span className="bg-emerald-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</span>}
                                </h3>
                                <p className="text-sm text-slate-400">{league.name} • Admin: {league.adminName || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                                <span className={`text-[10px] font-bold px-2 py-1 rounded border ${league.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/50' : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/50'} uppercase`}>
                                    {league.status}
                                </span>
                            </div>
                        </div>

                        {/* Import MatchAdminPanel which manages the match mode details for this league */}
                        <MatchAdminPanel league={league} onUpdate={onRefresh} />
                    </div>
                ))}
                
                {matchLeagues.length === 0 && (
                    <div className="text-center p-12 bg-[#1E293B] border border-slate-700 rounded-xl text-slate-400 italic">
                        No hay ligas corporativas/bares configuradas todavía.
                    </div>
                )}
            </div>
        </div>
    );
}

/* =============================================================================
   MATCH PURCHASES ADMIN TAB
   ============================================================================= */
function MatchPurchasesAdminTab() {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    useEffect(() => {
        fetchPurchases();
    }, []);

    const fetchPurchases = async () => {
        setLoading(true);
        try {
            const { data } = await superAdminService.getMatchPurchasesPending();
            setPurchases(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching match purchases:', error);
            setPurchases([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (leagueId: string, purchaseId: string) => {
        if (!confirm('¿Aprobar esta compra y habilitar el partido/paquete?')) return;
        try {
            await superAdminService.approveMatchPurchase(leagueId, purchaseId);
            alert('Compra aprobada exitosamente');
            fetchPurchases();
        } catch (e) {
            alert('Error al aprobar la compra');
        }
    };

    const handleReject = async (leagueId: string, purchaseId: string) => {
        if (!confirm('¿Rechazar esta compra?')) return;
        try {
            await superAdminService.rejectMatchPurchase(leagueId, purchaseId);
            alert('Compra rechazada');
            fetchPurchases();
        } catch (e) {
            alert('Error al rechazar la compra');
        }
    };

    if (loading) {
        return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500" /></div>;
    }

    return (
        <div className="space-y-4">
            <div className="bg-[#1E293B] border border-slate-700 p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-russo uppercase text-white mb-2 flex items-center gap-2">
                    <ShoppingCart className="text-emerald-500" size={20} /> Compras Match Pendientes
                </h2>
                <p className="text-slate-400 text-sm">Aprueba o rechaza compras de partidos individuales y paquetes.</p>
            </div>

            {purchases.length === 0 ? (
                <div className="text-center py-16 bg-[#1E293B] border border-slate-700 rounded-xl">
                    <ShoppingCart size={48} className="mx-auto text-slate-600 mb-4" />
                    <p className="text-slate-400 font-bold">No hay compras pendientes</p>
                    <p className="text-slate-500 text-sm mt-1">Todas las compras han sido procesadas</p>
                </div>
            ) : (
                purchases.map((purchase: any) => (
                    <div key={purchase.id} className="bg-[#1E293B] border border-yellow-500/30 rounded-xl p-5 space-y-4">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-white font-bold text-sm uppercase">
                                    {purchase.league?.companyName || purchase.league?.name || 'Liga Desconocida'}
                                </p>
                                <p className="text-slate-400 text-xs mt-1">
                                    {purchase.league?.matchEventType === 'BAR' ? '🍺 Bar' : '🏢 Empresa'}
                                    {purchase.league?.adminName && ` • Admin: ${purchase.league.adminName}`}
                                    {purchase.league?.adminPhone && ` • ${purchase.league.adminPhone}`}
                                </p>
                                <p className="text-slate-500 text-[10px] mt-1">
                                    {purchase.matchId ? `Partido: ${purchase.matchId.substring(0, 8)}...` : `Paquete: ${purchase.packageId}`}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-emerald-400 font-russo text-lg">${Number(purchase.amount).toLocaleString('es-CO')}</p>
                                <p className="text-yellow-500 text-[10px] font-bold uppercase flex items-center justify-end gap-1">
                                    <Clock size={10} /> PENDIENTE
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleApprove(purchase.leagueId, purchase.id)}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <CheckCircle size={16} /> Aprobar
                            </button>
                            <button
                                onClick={() => handleReject(purchase.leagueId, purchase.id)}
                                className="flex-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2 transition-colors"
                            >
                                <X size={16} /> Rechazar
                            </button>
                            {purchase.voucherUrl && (
                                <button
                                    onClick={() => setSelectedImage(purchase.voucherUrl)}
                                    className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold text-sm py-2.5 px-4 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <Eye size={16} /> Ver
                                </button>
                            )}
                        </div>
                    </div>
                ))
            )}

            {selectedImage && (
                <div
                    className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm p-5"
                    onClick={() => setSelectedImage(null)}
                >
                    <button className="absolute top-5 right-5 text-white" onClick={() => setSelectedImage(null)}>
                        <X size={32} />
                    </button>
                    <img src={selectedImage} alt="Comprobante" className="max-w-full max-h-[90vh] rounded-xl" onClick={e => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
}
