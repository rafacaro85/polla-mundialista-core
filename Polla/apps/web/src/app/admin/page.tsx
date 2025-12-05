'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import {
    Trophy, Users, Shield, HelpCircle, Settings,
    ChevronLeft, Edit3, Clock, CheckCircle, PlayCircle
} from 'lucide-react';
import { UsersTable } from '@/components/admin/UsersTable';
import { LeaguesTable } from '@/components/admin/LeaguesTable';
import { BonusQuestionsTable } from '@/components/admin/BonusQuestionsTable';
import { EditMatchDialog } from '@/components/EditMatchDialog';
import { toast } from 'sonner';

/* =============================================================================
   COMPONENTE: ADMIN VIEW (PANEL DE CONTROL)
   ============================================================================= */
export default function AdminPage() {
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('matches'); // matches, users, leagues, questions

    // ESTADO PARA PARTIDOS
    const [matches, setMatches] = useState<any[]>([]);
    const [selectedMatch, setSelectedMatch] = useState<any | null>(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    // --- 1. VERIFICACIÓN DE ACCESO ---
    useEffect(() => {
        const verifyAdminAccess = async () => {
            try {
                const { data } = await api.get('/auth/profile');
                if (data.role === 'ADMIN' || data.role === 'SUPER_ADMIN') {
                    setIsAuthorized(true);
                    fetchMatches(); // Cargar partidos si es admin
                } else {
                    router.push('/');
                }
            } catch (error) {
                console.error('Error verificando acceso:', error);
                router.push('/');
            } finally {
                setLoading(false);
            }
        };
        verifyAdminAccess();
    }, [router]);

    // --- 2. CARGAR PARTIDOS ---
    const fetchMatches = async () => {
        try {
            const { data } = await api.get('/matches');
            setMatches(data);
        } catch (error) {
            console.error('Error cargando partidos:', error);
            toast.error('Error al cargar partidos');
        }
    };

    const handleEditMatch = (match: any) => {
        setSelectedMatch(match);
        setDialogOpen(true);
    };

    const handleMatchUpdated = () => {
        fetchMatches();
        setDialogOpen(false);
        setSelectedMatch(null);
    };

    // HELPER BANDERAS
    const getFlag = (teamName: string) => {
        // Mapa simple o fallback a flagcdn con código ISO si tuviéramos
        // Por ahora usaremos un helper básico o el que ya tenías
        // Si el objeto match trae flag, mejor. Si no, un mapa básico.
        // Asumimos que match.homeFlag viene del backend, si no, fallback.
        return `https://flagcdn.com/h24/un.png`;
    };

    // Mejorado: Usar la info del match si existe
    const getTeamFlag = (match: any, side: 'home' | 'away') => {
        if (side === 'home') return match.homeFlag || getFlag(match.homeTeam);
        return match.awayFlag || getFlag(match.awayTeam);
    }

    // SISTEMA DE DISEÑO
    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '100px',
            backgroundColor: '#0F172A', // Obsidian
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            color: 'white'
        },
        // HEADER
        header: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
        },
        titleBox: {
            display: 'flex',
            flexDirection: 'column' as const
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '22px',
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
        backBtn: {
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            color: '#94A3B8',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },

        // MENU PESTAÑAS (PILL STYLE)
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '10px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            transition: 'all 0.2s',
            whiteSpace: 'nowrap' as const
        },
        activeTab: {
            backgroundColor: '#00E676', // Signal
            color: '#0F172A',
            boxShadow: '0 2px 10px rgba(0,230,118,0.2)'
        },
        inactiveTab: {
            backgroundColor: 'transparent',
            color: '#94A3B8'
        },

        // TARJETA DE PARTIDO (ADMIN ROW)
        matchCard: {
            backgroundColor: '#1E293B',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '12px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px',
            position: 'relative' as const,
            overflow: 'hidden'
        },
        matchHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: '#94A3B8',
            letterSpacing: '0.5px'
        },
        statusBadge: {
            padding: '2px 8px',
            borderRadius: '100px',
            fontSize: '9px',
            fontWeight: '900',
            textTransform: 'uppercase' as const,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },
        teamsRow: {
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '16px'
        },
        team: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '18px'
        },
        scoreBox: {
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '6px',
            padding: '6px 12px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '20px',
            color: 'white',
            textAlign: 'center' as const,
            minWidth: '60px'
        },
        actionsFooter: {
            display: 'flex',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid #334155'
        },
        actionBtn: {
            flex: 1,
            padding: '8px',
            borderRadius: '6px',
            border: '1px solid',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            textAlign: 'center' as const,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '6px'
        }
    };

    // Helper para estilo de estado
    const getStatusStyle = (status: string) => {
        if (status === 'LIVE') return { bg: 'rgba(255, 23, 68, 0.1)', color: '#FF1744', icon: <PlayCircle size={10} />, text: 'EN VIVO' };
        if (status === 'FINISHED') return { bg: 'rgba(148, 163, 184, 0.1)', color: '#94A3B8', icon: <CheckCircle size={10} />, text: 'FINALIZADO' };
        return { bg: 'rgba(0, 230, 118, 0.1)', color: '#00E676', icon: <Clock size={10} />, text: 'PROGRAMADO' };
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-obsidian flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-signal"></div>
            </div>
        );
    }

    if (!isAuthorized) return null;

    return (
        <div style={STYLES.container}>

            {/* 1. HEADER */}
            <div style={STYLES.header}>
                <div style={STYLES.titleBox}>
                    <h1 style={STYLES.title}>Panel Admin</h1>
                    <span style={STYLES.subtitle}>Control Central</span>
                </div>
                <button onClick={() => router.push('/')} style={STYLES.backBtn}>
                    <ChevronLeft size={14} /> Volver
                </button>
            </div>

            {/* 2. MENU PESTAÑAS */}
            <div style={STYLES.tabsContainer} className="no-scrollbar">
                {[
                    { id: 'matches', label: 'Partidos', icon: <Trophy size={14} /> },
                    { id: 'users', label: 'Usuarios', icon: <Users size={14} /> },
                    { id: 'leagues', label: 'Ligas', icon: <Shield size={14} /> },
                    { id: 'questions', label: 'Preguntas', icon: <HelpCircle size={14} /> }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{ ...STYLES.tab, ...(activeTab === tab.id ? STYLES.activeTab : STYLES.inactiveTab) }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* 3. CONTENIDO */}

            {/* PESTAÑA PARTIDOS */}
            {activeTab === 'matches' && (
                <div>
                    {matches.map(match => {
                        const statusStyle = getStatusStyle(match.status);
                        const dateStr = new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

                        return (
                            <div key={match.id} style={STYLES.matchCard}>

                                {/* Header Tarjeta */}
                                <div style={STYLES.matchHeader}>
                                    <span>{dateStr}</span>
                                    <div style={{ ...STYLES.statusBadge, backgroundColor: statusStyle.bg, color: statusStyle.color }}>
                                        {statusStyle.icon} {statusStyle.text}
                                    </div>
                                </div>

                                {/* Equipos y Marcador */}
                                <div style={STYLES.teamsRow}>
                                    {/* Local */}
                                    <div style={{ ...STYLES.team, justifyContent: 'flex-end' }}>
                                        <span>{match.homeTeam}</span>
                                        {/* Usamos un placeholder o flag si existe */}
                                        <div className="w-6 h-4 bg-slate-700 rounded overflow-hidden">
                                            {match.homeFlag && <img src={match.homeFlag} alt={match.homeTeam} className="w-full h-full object-cover" />}
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div style={STYLES.scoreBox}>
                                        {match.homeScore ?? '-'} - {match.awayScore ?? '-'}
                                    </div>

                                    {/* Visitante */}
                                    <div style={STYLES.team}>
                                        <div className="w-6 h-4 bg-slate-700 rounded overflow-hidden">
                                            {match.awayFlag && <img src={match.awayFlag} alt={match.awayTeam} className="w-full h-full object-cover" />}
                                        </div>
                                        <span>{match.awayTeam}</span>
                                    </div>
                                </div>

                                {/* Acciones */}
                                <div style={STYLES.actionsFooter}>
                                    <button
                                        onClick={() => handleEditMatch(match)}
                                        style={{ ...STYLES.actionBtn, backgroundColor: '#00E676', borderColor: '#00E676', color: '#0F172A' }}
                                    >
                                        <Edit3 size={12} /> Editar
                                    </button>
                                </div>

                            </div>
                        );
                    })}
                </div>
            )}

            {/* OTRAS PESTAÑAS (Componentes Existentes) */}
            {activeTab === 'users' && <UsersTable />}
            {activeTab === 'leagues' && <LeaguesTable />}
            {activeTab === 'questions' && <BonusQuestionsTable />}

            {/* DIÁLOGO DE EDICIÓN */}
            {selectedMatch && (
                <EditMatchDialog
                    match={selectedMatch}
                    open={dialogOpen}
                    onOpenChange={setDialogOpen}
                    onMatchUpdated={handleMatchUpdated}
                />
            )}

        </div>
    );
}
