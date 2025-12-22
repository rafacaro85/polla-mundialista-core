"use client";

import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Users, Trophy, Banknote, TrendingUp, ShieldAlert,
    CheckCircle, ChevronRight, LayoutDashboard, Shield, Download,
    Share2, Instagram, Facebook, MessageCircle, Music2, Mail, Save, HelpCircle, Eye, FileText,
    Building2, Rocket
} from 'lucide-react';
import { superAdminService } from '@/services/superAdminService';
import { BonusQuestionsTable } from '@/components/admin/BonusQuestionsTable';
import { UsersTable } from '@/components/admin/UsersTable';
import { LeaguesTable } from '@/components/admin/LeaguesTable';
import { MatchesList } from '@/components/admin/MatchesList';
import { CreateEnterpriseLeagueForm } from '@/components/admin/CreateEnterpriseLeagueForm';

/* =============================================================================
   DATOS MOCK
   ============================================================================= */

// SISTEMA DE DISEÑO BLINDADO
const STYLES = {
    container: {
        backgroundColor: '#0F172A', // Obsidian
        minHeight: '100vh',
        padding: '16px',
        paddingBottom: '100px',
        color: 'white',
        fontFamily: 'sans-serif'
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

    const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, users, transactions
    const [loading, setLoading] = useState(true);

    // Real Data State
    const [stats, setStats] = useState({
        kpis: { totalIncome: 0, activeLeagues: 0, totalUsers: 0, todaySales: 0 },
        salesTrend: [],
        recentTransactions: [],
        users: [],
        leagues: []
    });

    const [settingsForm, setSettingsForm] = useState<any>({});
    const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardData, settingsData] = await Promise.all([
                superAdminService.getDashboardStats(),
                superAdminService.getSettings()
            ]);
            setStats(dashboardData as any);
            setSettingsForm(settingsData);
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await superAdminService.updateSettings(settingsForm);
            alert("Configuración guardada correctamente");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Error al guardar la configuración");
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
        return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
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

    const KPI_DATA_REAL = [
        { title: "Ingresos Totales", value: formatCompact(stats.kpis.totalIncome), label: "COP", icon: Banknote, color: "#00E676" },
        { title: "Pollas Activas", value: stats.kpis.activeLeagues, label: "Torneos", icon: Trophy, color: "#FACC15" },
        { title: "Usuarios Totales", value: formatCompact(stats.kpis.totalUsers), label: "Jugadores", icon: Users, color: "#38BDF8" },
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

            {/* 1. HEADER */}
            <div style={STYLES.header}>
                <div style={STYLES.titleBox}>
                    <h1 style={STYLES.title}>Super Admin</h1>
                    <span style={STYLES.subtitle}>Control Central</span>
                </div>
                <a
                    href="/"
                    style={{
                        ...STYLES.systemBadge,
                        textDecoration: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 230, 118, 0.2)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(0, 230, 118, 0.1)'; }}
                >
                    <ChevronRight size={10} style={{ transform: 'rotate(180deg)' }} /> VOLVER
                </a>
            </div>

            {/* 2. MENÚ DE PESTAÑAS (PILL TABS) */}
            <div style={STYLES.tabsContainer} className="no-scrollbar">
                {[
                    { id: 'dashboard', label: 'Resumen', icon: <LayoutDashboard size={14} /> },
                    { id: 'users', label: 'Usuarios', icon: <Eye size={14} /> },
                    { id: 'leagues', label: 'Pollas', icon: <Trophy size={14} /> },
                    { id: 'matches', label: 'Partidos', icon: <Shield size={14} /> },
                    { id: 'questions', label: 'Preguntas', icon: <HelpCircle size={14} /> },
                    { id: 'transactions', label: 'Ventas', icon: <Banknote size={14} />, badge: pendingCount },
                    { id: 'enterprise', label: 'Empresas B2B', icon: <Building2 size={14} /> },
                    { id: 'settings', label: 'Redes Sociales', icon: <Share2 size={14} /> }
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
                <BonusQuestionsTable />
            )}

            {/* --- CONTENIDO DINÁMICO --- */}

            {/* A. PESTAÑA DASHBOARD (KPIs + GRÁFICA) */}
            {
                activeTab === 'dashboard' && (
                    <>
                        {/* KPIs GRID */}
                        <div style={STYLES.kpiGrid}>
                            {KPI_DATA_REAL.map((kpi, index) => (
                                <div key={index} style={STYLES.kpiCard}>
                                    <div style={STYLES.kpiHeader}>
                                        <kpi.icon size={14} color={kpi.color} />
                                        {kpi.title}
                                    </div>
                                    <div style={{ ...STYLES.kpiValue, color: kpi.isSpecial ? '#00E676' : 'white' }}>
                                        {kpi.value}
                                    </div>
                                    <div style={STYLES.kpiLabel}>{kpi.label}</div>
                                    {/* Barra decorativa inferior */}
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '3px', backgroundColor: kpi.color, opacity: 0.5 }} />
                                </div>
                            ))}
                        </div>

                        {/* GRÁFICA DE INGRESOS */}
                        <div style={STYLES.chartCard}>
                            <div style={STYLES.chartTitle}>
                                <TrendingUp size={16} color="#00E676" /> Tendencia de Ingresos
                            </div>
                            <div style={{ width: '100%', height: 200 }}>
                                <ResponsiveContainer>
                                    <AreaChart data={stats.salesTrend}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#00E676" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#00E676" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                        <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', color: 'white', fontSize: '12px' }}
                                            itemStyle={{ color: '#00E676' }}
                                            formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#00E676" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )
            }

            {/* H. PESTAÑA EMPRESAS (NUEVO) */}
            {activeTab === 'enterprise' && (
                <div className="animate-in fade-in duration-500">
                    <div className="bg-[#1E293B] rounded-xl p-8 border border-indigo-500/30 flex flex-col items-center text-center max-w-2xl mx-auto mb-8 shadow-2xl shadow-indigo-500/10">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-indigo-500/30">
                            <Building2 size={32} className="text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Gestión Corporativa (B2B)</h2>
                        <p className="text-slate-400 text-sm mb-6 max-w-md">
                            Herramienta para dar de alta clientes empresariales manualmente.
                            Crea la liga, asigna el plan y omite la pasarela de pagos.
                        </p>
                        <button
                            onClick={() => setShowEnterpriseModal(true)}
                            className="group bg-white hover:bg-slate-50 text-indigo-900 font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-white/10 flex items-center gap-3 transform hover:scale-105 active:scale-95"
                        >
                            <Rocket size={20} className="text-indigo-600 group-hover:animate-bounce" />
                            Alta Rápida de Empresa
                        </button>
                    </div>

                    <div className="mb-4 flex items-center gap-2 px-2">
                        <Trophy size={16} className="text-indigo-400" />
                        <h3 className="text-sm font-bold text-slate-300 uppercase">Últimas Ligas Creadas</h3>
                    </div>
                    <LeaguesTable />
                </div>
            )}

            {showEnterpriseModal && (
                <CreateEnterpriseLeagueForm
                    onClose={() => setShowEnterpriseModal(false)}
                    onSuccess={() => {
                        loadDashboardData();
                        setShowEnterpriseModal(false);
                    }}
                />
            )}

            {/* B. PESTAÑA USUARIOS (OJO DE DIOS) - REEMPLAZADO POR UsersTable */}
            {activeTab === 'users' && <UsersTable />}

            {/* E. PESTAÑA LIGAS - REEMPLAZADO POR LeaguesTable */}
            {activeTab === 'leagues' && <LeaguesTable />}

            {/* F. PESTAÑA PARTIDOS - NUEVO COMPONENTE */}
            {activeTab === 'matches' && <MatchesList />}

            {/* C. PESTAÑA VENTAS (TRANSACCIONES) */}
            {
                activeTab === 'transactions' && (
                    <div>
                        {stats.recentTransactions
                            .sort((a: any, b: any) => {
                                if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
                                if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
                                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                            })
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
                                                {tx.user?.nickname || tx.user?.email}
                                                <span style={{
                                                    ...STYLES.planBadge,
                                                    backgroundColor: 'rgba(250, 204, 21, 0.1)', // Default gold for now
                                                    color: '#FACC15'
                                                }}>
                                                    {tx.packageId || 'PLAN'}
                                                </span>
                                            </span>
                                            <span style={STYLES.txDate}>{new Date(tx.createdAt).toLocaleString()}</span>
                                            {tx.league && (
                                                <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '4px' }}>
                                                    Liga: {tx.league.name}
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
                            ))}
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
        </div>
    );
}
