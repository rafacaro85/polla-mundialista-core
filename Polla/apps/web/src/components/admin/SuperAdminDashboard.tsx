"use client";

import React, { useState, useEffect } from 'react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    Users, Trophy, Banknote, TrendingUp, Search, ShieldAlert,
    Eye, Edit, Ban, FileText, CheckCircle, ChevronRight, LayoutDashboard, Shield, Download,
    Share2, Instagram, Facebook, MessageCircle, Music2, Mail, Save
} from 'lucide-react';
import { superAdminService } from '@/services/superAdminService';
import LeagueBrandingForm from '@/components/LeagueBrandingForm';
import MatchManager from '@/components/admin/MatchManager';

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

    // SECCIÓN USUARIOS (OJO DE DIOS)
    searchBox: {
        position: 'relative' as const,
        marginBottom: '16px',
        display: 'flex',
        gap: '8px'
    },
    searchInput: {
        flex: 1,
        padding: '12px 16px 12px 40px',
        backgroundColor: '#1E293B',
        border: '1px solid #334155',
        borderRadius: '12px',
        color: 'white',
        outline: 'none',
        fontSize: '14px'
    },
    searchIcon: { position: 'absolute' as const, left: '12px', top: '12px', color: '#94A3B8' },
    searchBtn: {
        backgroundColor: '#00E676',
        color: '#0F172A',
        border: 'none',
        borderRadius: '12px',
        padding: '0 16px',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    userResultCard: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        border: '1px solid #00E676', // Borde verde si encuentra
        padding: '16px',
        boxShadow: '0 0 20px rgba(0,230,118,0.1)'
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
    const [selectedUser, setSelectedUser] = useState<any>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editPoints, setEditPoints] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    // Real Data State
    const [stats, setStats] = useState({
        kpis: { totalIncome: 0, activeLeagues: 0, totalUsers: 0, todaySales: 0 },
        salesTrend: [],
        recentTransactions: [],
        users: [],
        leagues: []
    });

    const [editingLeague, setEditingLeague] = useState<any>(null);

    const [settingsForm, setSettingsForm] = useState<any>({});

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [dashboardData, settingsData, leaguesData] = await Promise.all([
                superAdminService.getDashboardStats(),
                superAdminService.getSettings(),
                superAdminService.getAllLeagues()
            ]);
            setStats({ ...dashboardData, leagues: leaguesData } as any);
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

    // Filter Users
    const filteredUsers = stats.users.filter((u: any) =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nickname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Actions
    const handleViewUser = (user: any) => {
        setSelectedUser(user);
        setEditPoints(user.globalPoints || 0);
        setIsEditing(false);
    };

    const handleEditUser = (user: any) => {
        setSelectedUser(user);
        setEditPoints(user.globalPoints || 0);
        setIsEditing(true);
    };

    const handleSavePoints = async () => {
        if (!selectedUser) return;
        try {
            await superAdminService.updateUserPoints(selectedUser.id, editPoints);
            alert("Puntos actualizados correctamente");
            setIsEditing(false);
            loadDashboardData(); // Reload data
        } catch (error) {
            console.error("Error updating points:", error);
            alert("Error al actualizar puntos");
        }
    };

    const handleBanUser = async (userId: string) => {
        if (!confirm("¿Estás seguro de bloquear/desbloquear a este usuario?")) return;
        // TODO: Implement ban logic in service
        alert("Funcionalidad de bloqueo en desarrollo");
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
            'FAILED': 'FALLIDO',
            'APPROVED': 'APROBADO'
        };
        return map[status] || status;
    };

    const KPI_DATA_REAL = [
        { title: "Ingresos Totales", value: formatCompact(stats.kpis.totalIncome), label: "COP", icon: Banknote, color: "#00E676" },
        { title: "Ligas Activas", value: stats.kpis.activeLeagues, label: "Torneos", icon: Trophy, color: "#FACC15" },
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
                    { id: 'leagues', label: 'Ligas', icon: <Trophy size={14} /> },
                    { id: 'matches', label: 'Partidos', icon: <Shield size={14} /> },
                    { id: 'transactions', label: 'Ventas', icon: <Banknote size={14} /> },
                    { id: 'settings', label: 'Redes Sociales', icon: <Share2 size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedUser(null); }}
                        style={{ ...STYLES.tab, ...(activeTab === tab.id ? STYLES.activeTab : STYLES.inactiveTab) }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* --- CONTENIDO DINÁMICO --- */}

            {/* A. PESTAÑA DASHBOARD (KPIs + GRÁFICA) */}
            {activeTab === 'dashboard' && (
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
            )}

            {/* B. PESTAÑA USUARIOS (OJO DE DIOS) */}
            {activeTab === 'users' && !selectedUser && (
                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
                    <div style={STYLES.searchBox}>
                        <Search size={18} style={STYLES.searchIcon} />
                        <input
                            type="text"
                            placeholder="Buscar usuario..."
                            style={STYLES.searchInput}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="no-scrollbar">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user: any) => (
                                <div key={user.id} style={{ ...STYLES.userResultCard, marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#0F172A', border: '1px solid #00E676', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E676', fontWeight: 'bold', overflow: 'hidden' }}>
                                            {user.avatarUrl ? <img src={user.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (user.nickname?.[0] || user.email[0]).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: 'bold' }}>{user.nickname || user.fullName || 'Sin nombre'}</div>
                                            <div style={{ fontSize: '12px', color: '#94A3B8' }}>{user.email}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleViewUser(user)}
                                            style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', borderRadius: '8px', color: '#38BDF8', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            style={{ flex: 1, padding: '8px', backgroundColor: '#00E676', border: 'none', borderRadius: '8px', color: '#0F172A', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleBanUser(user.id)}
                                            style={{ flex: 1, padding: '8px', backgroundColor: 'rgba(255,23,68,0.1)', border: '1px solid #FF1744', borderRadius: '8px', color: '#FF1744', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer' }}
                                        >
                                            Banear
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#64748B', marginTop: '40px' }}>
                                <Shield size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                <p style={{ fontSize: '12px' }}>No se encontraron usuarios.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* DETALLE DE USUARIO (MODAL/VISTA) */}
            {activeTab === 'users' && selectedUser && (
                <div style={{ backgroundColor: '#1E293B', borderRadius: '16px', padding: '16px', border: '1px solid #334155' }}>
                    <button
                        onClick={() => setSelectedUser(null)}
                        style={{ marginBottom: '16px', background: 'none', border: 'none', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px' }}
                    >
                        <ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /> Volver a la lista
                    </button>

                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#0F172A', border: '2px solid #00E676', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#00E676', fontSize: '24px', fontWeight: 'bold', overflow: 'hidden' }}>
                            {selectedUser.avatarUrl ? <img src={selectedUser.avatarUrl} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (selectedUser.nickname?.[0] || selectedUser.email[0]).toUpperCase()}
                        </div>
                        <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0' }}>{selectedUser.nickname || selectedUser.fullName}</h2>
                        <p style={{ color: '#94A3B8', fontSize: '12px', margin: '4px 0 0' }}>{selectedUser.email}</p>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', color: '#94A3B8', fontSize: '11px', fontWeight: 'bold', marginBottom: '8px', textTransform: 'uppercase' }}>Puntos Globales</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="number"
                                value={editPoints}
                                onChange={(e) => setEditPoints(Number(e.target.value))}
                                disabled={!isEditing}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '8px', color: 'white', fontWeight: 'bold' }}
                            />
                            {isEditing && (
                                <button onClick={handleSavePoints} style={{ padding: '0 16px', backgroundColor: '#00E676', border: 'none', borderRadius: '8px', color: '#0F172A', fontWeight: 'bold', cursor: 'pointer' }}>
                                    Guardar
                                </button>
                            )}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#FACC15' }}>0</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>PREDICCIONES</div>
                        </div>
                        <div style={{ backgroundColor: '#0F172A', padding: '12px', borderRadius: '12px', textAlign: 'center' }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#38BDF8' }}>0</div>
                            <div style={{ fontSize: '10px', color: '#64748B' }}>LIGAS</div>
                        </div>
                    </div>
                </div>
            )}

            {/* C. PESTAÑA VENTAS (TRANSACCIONES) */}
            {activeTab === 'transactions' && (
                <div>
                    {stats.recentTransactions.map((tx: any) => (
                        <div key={tx.id} style={STYLES.txCard}>

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
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={STYLES.txValue}>{formatCurrency(Number(tx.amount))}</div>
                                    <div style={{ fontSize: '9px', color: '#00E676', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '2px' }}>
                                        <CheckCircle size={10} /> {translateStatus(tx.status)}
                                    </div>
                                </div>
                            </div>

                            {/* BOTÓN DESCARGA (NUEVO) */}
                            <button
                                style={STYLES.voucherBtn}
                                onClick={() => handleDownloadVoucher(tx.id)}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#F8FAFC'; e.currentTarget.style.borderColor = '#94A3B8'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#94A3B8'; e.currentTarget.style.borderColor = '#475569'; }}
                            >
                                <Download size={14} /> Descargar Voucher
                            </button>

                        </div>
                    ))}
                </div>
            )}

            {/* D. PESTAÑA REDES SOCIALES (SETTINGS) */}
            {activeTab === 'settings' && (
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
            )}
            {/* E. PESTAÑA LIGAS */}
            {activeTab === 'leagues' && (
                <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
                    <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }} className="no-scrollbar">
                        {stats.leagues.length > 0 ? (
                            stats.leagues.map((league: any) => (
                                <div key={league.id} style={{ ...STYLES.userResultCard, marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: '#0F172A', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                            {league.brandingLogoUrl ? <img src={league.brandingLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Trophy size={20} color="#94A3B8" />}
                                        </div>
                                        <div>
                                            <div style={{ color: 'white', fontWeight: 'bold' }}>{league.name}</div>
                                            <div style={{ fontSize: '11px', color: '#94A3B8' }}>{league.participants?.length || 0} Participantes • {league.type}</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setEditingLeague(league)}
                                        style={{ padding: '8px 12px', backgroundColor: '#334155', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                                    >
                                        <Edit size={14} /> Editar
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div style={{ textAlign: 'center', color: '#64748B', marginTop: '40px' }}>
                                <Trophy size={40} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
                                <p style={{ fontSize: '12px' }}>No se encontraron ligas.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL EDITAR LIGA */}
            {editingLeague && (
                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                    <div style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
                            <button onClick={() => setEditingLeague(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>Cerrar</button>
                        </div>
                        <LeagueBrandingForm
                            leagueId={editingLeague.id}
                            initialData={editingLeague}
                            onSuccess={() => {
                                setEditingLeague(null);
                                loadDashboardData();
                            }}
                        />
                    </div>
                </div>
            )}
            {/* F. PESTAÑA PARTIDOS */}
            {activeTab === 'matches' && (
                <MatchManager />
            )}
        </div>
    );
}
