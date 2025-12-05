'use client';

import React, { useEffect, useState } from 'react';
import { X, Users, Copy, Trophy, Shield, Medal, ChevronLeft, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface League {
    id: string;
    name: string;
    code: string;
    admin?: string;
    members?: number;
    capacity?: number;
    creator?: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
    participantCount?: number;
    maxParticipants?: number;
}

interface Participant {
    id: string;
    nickname: string;
    avatarUrl?: string;
    points: number;
    rank: number;
    user?: {
        nickname: string;
        avatarUrl?: string;
    };
    totalPoints?: number;
}

interface ViewLeagueDialogProps {
    league: League | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

/* =============================================================================
   COMPONENTE: MODAL VER LIGA (TACTICAL STYLE)
   ============================================================================= */
export function ViewLeagueDialog({ league, open, onOpenChange }: ViewLeagueDialogProps) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && league) {
            loadRanking(league.id);
        }
    }, [open, league]);

    const loadRanking = async (leagueId: string) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/leagues/${leagueId}/ranking`);

            // Normalizar datos
            const mapped = Array.isArray(data) ? data.map((item: any, index: number) => ({
                id: item.id || item.user?.id,
                nickname: item.nickname || item.user?.nickname || 'Anónimo',
                avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                rank: index + 1
            })) : [];

            setParticipants(mapped.sort((a, b) => b.points - a.points).map((p, i) => ({ ...p, rank: i + 1 })));
        } catch (error) {
            console.error('Error loading ranking:', error);
            toast.error('Error al cargar el ranking');
        } finally {
            setLoading(false);
        }
    };

    if (!open || !league) return null;

    // Mapear datos de la liga para la vista
    const leagueData = {
        name: league.name,
        code: league.code,
        members: league.participantCount || league.members || 0,
        capacity: league.maxParticipants || league.capacity || 20,
        adminId: league.creator?.id
    };

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
        },
        card: {
            backgroundColor: '#1E293B', // Carbon
            width: '100%',
            maxWidth: '420px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 60px rgba(0,0,0,0.7)',
            display: 'flex',
            flexDirection: 'column' as const,
            maxHeight: '90vh',
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },

        // HEADER PRINCIPAL
        header: {
            padding: '24px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 1) 0%, rgba(30, 41, 59, 1) 100%)',
            borderBottom: '1px solid #334155',
            position: 'relative' as const
        },
        closeBtn: {
            position: 'absolute' as const,
            top: '16px',
            right: '16px',
            background: 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.2s'
        },
        backBtn: {
            position: 'absolute' as const,
            top: '16px',
            left: '16px',
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: 'bold'
        },

        // INFO DE LA LIGA
        leagueInfoBox: {
            marginTop: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            textAlign: 'center' as const
        },
        leagueIcon: {
            width: '72px',
            height: '72px',
            borderRadius: '20px',
            backgroundColor: '#0F172A',
            border: '2px solid #00E676',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '32px', fontFamily: "'Russo One', sans-serif", color: '#00E676',
            boxShadow: '0 0 20px rgba(0, 230, 118, 0.15)',
            marginBottom: '12px'
        },
        leagueName: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '24px',
            color: 'white',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            lineHeight: '1.1'
        },
        statsRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '8px',
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: '600'
        },
        codeBadge: {
            backgroundColor: 'rgba(0, 230, 118, 0.1)',
            color: '#00E676',
            border: '1px dashed #00E676',
            padding: '4px 8px',
            borderRadius: '6px',
            fontFamily: 'monospace',
            letterSpacing: '1px',
            display: 'flex', alignItems: 'center', gap: '6px',
            cursor: 'pointer'
        },

        // LISTA DE RANKING (SCROLLABLE)
        body: {
            flex: 1,
            overflowY: 'auto' as const,
            padding: '0',
            backgroundColor: '#1E293B'
        },
        sectionTitle: {
            padding: '16px 24px 8px',
            fontSize: '10px',
            fontWeight: '900',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            display: 'flex', alignItems: 'center', gap: '8px'
        },
        rankingList: {
            display: 'flex',
            flexDirection: 'column' as const
        },
        rankingItem: {
            display: 'flex',
            alignItems: 'center',
            padding: '12px 24px',
            borderBottom: '1px solid rgba(51, 65, 85, 0.3)',
            transition: 'background 0.2s'
        },
        rankPos: {
            width: '24px',
            fontSize: '14px',
            fontWeight: '900',
            textAlign: 'center' as const,
            marginRight: '12px'
        },
        userAvatar: {
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 'bold', color: 'white',
            marginRight: '12px',
            overflow: 'hidden'
        },
        userInfo: {
            flex: 1
        },
        userName: {
            color: 'white',
            fontWeight: 'bold',
            fontSize: '14px',
            display: 'flex', alignItems: 'center', gap: '6px'
        },
        adminTag: {
            fontSize: '8px',
            backgroundColor: '#FACC15',
            color: '#0F172A',
            padding: '1px 4px',
            borderRadius: '3px',
            fontWeight: '900'
        },
        points: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '16px',
            color: 'white'
        },
        pointsLabel: {
            fontSize: '8px',
            color: '#64748B',
            fontWeight: 'bold',
            display: 'block',
            textAlign: 'right' as const
        }
    };

    // Helper para medallas
    const getRankIcon = (rank: number) => {
        if (rank === 1) return { color: '#FACC15', icon: <Medal size={18} fill="#FACC15" /> }; // Gold
        if (rank === 2) return { color: '#E2E8F0', icon: <Medal size={16} fill="#CBD5E1" /> }; // Silver
        if (rank === 3) return { color: '#B45309', icon: <Medal size={16} fill="#B45309" /> }; // Bronze
        return { color: '#64748B', icon: <span style={{ fontFamily: "'Russo One', sans-serif" }}>{rank}</span> };
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(leagueData.code);
        toast.success('Código copiado');
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER & INFO */}
                <div style={STYLES.header}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.backBtn}>
                        <ChevronLeft size={16} /> Volver
                    </button>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={18} />
                    </button>

                    <div style={STYLES.leagueInfoBox}>
                        <div style={STYLES.leagueIcon}>
                            {leagueData.name.charAt(0).toUpperCase()}
                        </div>
                        <h2 style={STYLES.leagueName}>{leagueData.name}</h2>

                        <div style={STYLES.statsRow}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Users size={12} /> {leagueData.members} / {leagueData.capacity} Miembros
                            </div>
                            <span>•</span>
                            <div
                                style={STYLES.codeBadge}
                                onClick={handleCopyCode}
                                title="Copiar código"
                            >
                                {leagueData.code} <Copy size={10} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. LISTA DE RANKING */}
                <div style={STYLES.body} className="custom-scrollbar">
                    <div style={STYLES.sectionTitle}>
                        <Trophy size={14} color="#FACC15" /> TABLA DE POSICIONES
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="animate-spin text-signal" />
                        </div>
                    ) : (
                        <div style={STYLES.rankingList}>
                            {participants.map((user) => {
                                const rankStyle = getRankIcon(user.rank);
                                const isAdmin = user.id === leagueData.adminId;

                                return (
                                    <div key={user.id} style={{
                                        ...STYLES.rankingItem,
                                        backgroundColor: user.rank === 1 ? 'rgba(250, 204, 21, 0.05)' : 'transparent'
                                    }}>

                                        {/* Posición / Medalla */}
                                        <div style={{ ...STYLES.rankPos, color: rankStyle.color }}>
                                            {rankStyle.icon}
                                        </div>

                                        {/* Avatar */}
                                        <div style={{
                                            ...STYLES.userAvatar,
                                            borderColor: user.rank === 1 ? '#FACC15' : '#475569',
                                            boxShadow: user.rank === 1 ? '0 0 10px rgba(250,204,21,0.2)' : 'none'
                                        }}>
                                            {user.avatarUrl ? (
                                                <img src={user.avatarUrl} alt={user.nickname} className="w-full h-full object-cover" />
                                            ) : (
                                                user.nickname.substring(0, 2).toUpperCase()
                                            )}
                                        </div>

                                        {/* Info Usuario */}
                                        <div style={STYLES.userInfo}>
                                            <div style={STYLES.userName}>
                                                {user.nickname}
                                                {isAdmin && (
                                                    <span style={STYLES.adminTag}>ADMIN</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Puntos */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ ...STYLES.points, color: user.rank === 1 ? '#FACC15' : 'white' }}>
                                                {user.points}
                                            </div>
                                            <span style={STYLES.pointsLabel}>PTS</span>
                                        </div>

                                    </div>
                                );
                            })}
                            {participants.length === 0 && !loading && (
                                <div className="text-center py-8 text-slate-500 text-xs">
                                    No hay participantes aún.
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
