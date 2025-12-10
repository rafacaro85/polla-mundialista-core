import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, Crown, Users, ChevronDown, Check, Calculator } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import TieBreakerDialog from './TieBreakerDialog';

// --- INTERFACES ---
interface RankingUser {
    rank: number;
    name: string;
    points: number;
    avatar: string;
    isUser: boolean;
    trend: 'up' | 'down' | 'same';
    tieBreakerGuess?: number;
}

interface LeagueOption {
    id: string;
    name: string;
    icon?: React.ReactNode;
}

/* =============================================================================
   COMPONENTE: RANKING VIEW (CON DROPDOWN SELECTOR)
   ============================================================================= */
export const RankingView = () => {
    const { user } = useAppStore();
    const [selectedLeagueId, setSelectedLeagueId] = useState('global');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [leagues, setLeagues] = useState<LeagueOption[]>([]);
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

    // SISTEMA DE DISEÑO
    const COLORS = {
        gold: '#FACC15',
        silver: '#94A3B8',
        bronze: '#B45309',
        signal: '#00E676',
        obsidian: '#0F172A',
        carbon: '#1E293B',
        text: '#F8FAFC'
    };

    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '100px',
            backgroundColor: COLORS.obsidian,
            minHeight: '100vh',
            fontFamily: 'sans-serif'
        },
        contentWrapper: {
            maxWidth: '600px',
            margin: '0 auto',
            width: '100%',
            position: 'relative' as const
        },
        headerSection: {
            marginBottom: '24px',
            position: 'relative' as const, // Necesario para el dropdown absoluto
            zIndex: 20
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '24px',
            color: 'white',
            textTransform: 'uppercase' as const,
            marginBottom: '16px',
            textAlign: 'center' as const
        },

        // --- NUEVO: DROPDOWN SELECTOR ---
        dropdownTrigger: {
            width: '100%',
            backgroundColor: COLORS.carbon,
            border: `1px solid ${isDropdownOpen ? COLORS.signal : '#334155'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            color: 'white',
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: isDropdownOpen ? `0 0 15px rgba(0,230,118,0.2)` : 'none'
        },
        triggerText: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            color: isDropdownOpen ? COLORS.signal : 'white'
        },
        dropdownMenu: {
            position: 'absolute' as const,
            top: '100%', // Justo debajo del botón
            left: 0,
            right: 0,
            marginTop: '8px',
            backgroundColor: '#1E293B', // Carbon sólido
            border: '1px solid #334155',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            zIndex: 50
        },
        menuItem: {
            padding: '12px 16px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#94A3B8',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s'
        },

        // TARJETA PRINCIPAL
        rankingCard: {
            backgroundColor: COLORS.carbon,
            borderRadius: '16px',
            border: '1px solid #334155',
            overflow: 'hidden',
            boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
            zIndex: 10
        },
        tableHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(15, 23, 42, 0.8)',
            borderBottom: '1px solid #334155',
            fontSize: '10px',
            color: '#94A3B8',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        row: {
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            borderBottom: '1px solid #334155',
            position: 'relative' as const,
            transition: 'background 0.2s'
        },
        userRow: {
            backgroundColor: 'rgba(0, 230, 118, 0.08)',
        },
        rankCol: {
            width: '30px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '12px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '16px',
            color: '#94A3B8'
        },
        avatar: {
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: COLORS.obsidian,
            border: '1px solid #475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            marginRight: '12px'
        },
        infoCol: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center'
        },
        name: {
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            lineHeight: '1.2'
        },
        youTag: {
            fontSize: '9px',
            color: COLORS.signal,
            marginLeft: '6px',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.5px'
        },
        pointsCol: {
            textAlign: 'right' as const
        },
        points: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '18px',
            color: 'white'
        },
        trendIcon: {
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '2px'
        }
    };

    const getRankStyle = (rank: number, isLast: boolean) => {
        if (isLast) return { color: '#EF5350', icon: <span style={{ fontSize: '20px' }} title="Cuchara de Palo">🥄</span> };
        if (rank === 1) return { color: COLORS.gold, icon: <Trophy size={18} fill={COLORS.gold} /> };
        if (rank === 2) return { color: '#E2E8F0', icon: <Trophy size={16} fill="#94A3B8" /> };
        if (rank === 3) return { color: COLORS.bronze, icon: <Trophy size={16} fill={COLORS.bronze} /> };
        return { color: '#64748B', icon: <span style={{ fontSize: '14px' }}>{rank}</span> };
    };

    // Cargar Pollas
    useEffect(() => {
        const fetchLeagues = async () => {
            try {
                const { data } = await api.get('/leagues/my');
                const mappedLeagues: LeagueOption[] = data.map((l: any) => ({
                    id: l.id,
                    name: l.name,
                    icon: <Users size={16} />
                }));

                // Agregar Global al inicio
                setLeagues([
                    { id: 'global', name: 'Ranking Global', icon: <Crown size={16} /> },
                    ...mappedLeagues
                ]);
            } catch (error) {
                console.error('Error fetching leagues:', error);
                setLeagues([{ id: 'global', name: 'Ranking Global', icon: <Crown size={16} /> }]);
            }
        };
        fetchLeagues();
    }, []);

    // Cargar Ranking cuando cambia la liga
    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                const endpoint = selectedLeagueId === 'global'
                    ? '/leagues/global/ranking'
                    : `/leagues/${selectedLeagueId}/ranking`;

                const { data } = await api.get(endpoint);

                const mappedRanking: RankingUser[] = Array.isArray(data) ? data.map((item: any, index: number) => ({
                    rank: index + 1,
                    name: item.nickname || item.user?.nickname || 'Anónimo',
                    points: item.totalPoints || 0,
                    avatar: (item.nickname || item.user?.nickname || '?').substring(0, 2).toUpperCase(),
                    isUser: (item.id === user?.id) || (item.user?.id === user?.id),
                    trend: 'same',
                    tieBreakerGuess: item.tieBreakerGuess
                })) : [];

                setRanking(mappedRanking);
            } catch (error) {
                console.error('Error fetching ranking:', error);
                setRanking([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchRanking();
        }
    }, [selectedLeagueId, user]);

    // Datos actuales
    const selectedLeague = leagues.find(l => l.id === selectedLeagueId) || leagues[0] || { id: 'global', name: 'Cargando...', icon: <Crown size={16} /> };
    const currentRanking = ranking;

    return (
        <div style={STYLES.container}>
            <div style={STYLES.contentWrapper}>
                {/* 1. HEADER & SELECTOR */}
                <div style={STYLES.headerSection}>
                    <h2 style={STYLES.title}>Ranking</h2>

                    {/* BOTÓN SELECTOR (TRIGGER) */}
                    <div
                        style={STYLES.dropdownTrigger}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div style={STYLES.triggerText}>
                            {selectedLeague.icon}
                            {selectedLeague.name}
                        </div>
                        <ChevronDown
                            size={20}
                            color={isDropdownOpen ? COLORS.signal : '#94A3B8'}
                            style={{ transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
                        />
                    </div>

                    {/* MENÚ DESPLEGABLE (LISTA) */}
                    {isDropdownOpen && (
                        <div style={STYLES.dropdownMenu}>
                            {leagues.map(league => {
                                const isSelected = selectedLeagueId === league.id;
                                return (
                                    <div
                                        key={league.id}
                                        style={{
                                            ...STYLES.menuItem,
                                            backgroundColor: isSelected ? 'rgba(0, 230, 118, 0.1)' : 'transparent',
                                            color: isSelected ? COLORS.signal : '#94A3B8'
                                        }}
                                        onClick={() => {
                                            setSelectedLeagueId(league.id);
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            {league.icon}
                                            <span style={{ fontFamily: isSelected ? "'Russo One', sans-serif" : 'sans-serif' }}>
                                                {league.name}
                                            </span>
                                        </div>
                                        {isSelected && <Check size={16} color={COLORS.signal} />}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* 2. TABLA DE POSICIONES */}
                {/* BOTÓN DESEMPATE (Solo en ligas específicas) */}
                {selectedLeagueId !== 'global' && (
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <button
                            onClick={() => setIsTieBreakerOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                padding: '10px 20px', borderRadius: '12px',
                                backgroundColor: ranking.find(u => u.isUser)?.tieBreakerGuess != null ? '#1E293B' : 'rgba(250, 204, 21, 0.1)',
                                border: ranking.find(u => u.isUser)?.tieBreakerGuess != null ? '1px solid #334155' : '1px solid #FACC15',
                                fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase',
                                color: ranking.find(u => u.isUser)?.tieBreakerGuess != null ? '#94A3B8' : '#FACC15',
                                boxShadow: ranking.find(u => u.isUser)?.tieBreakerGuess != null ? 'none' : '0 0 15px rgba(250, 204, 21, 0.2)',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            <Calculator size={16} />
                            {ranking.find(u => u.isUser)?.tieBreakerGuess != null
                                ? `Tie-Breaker: ${ranking.find(u => u.isUser)?.tieBreakerGuess} Goles`
                                : '⚠️ Configurar Desempate'}
                        </button>
                    </div>
                )}

                <div style={STYLES.rankingCard}>
                    <div style={STYLES.tableHeader}>
                        <span>Posición / Usuario</span>
                        <span>Puntos</span>
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-slate-400">Cargando ranking...</div>
                    ) : currentRanking.length > 0 ? (
                        currentRanking.map((user, index) => {
                            const isLast = index === currentRanking.length - 1 && currentRanking.length > 1;
                            const rankStyle = getRankStyle(user.rank, isLast);
                            const isUserStyle = user.isUser ? STYLES.userRow : {};

                            return (
                                <div key={user.rank} style={{ ...STYLES.row, ...isUserStyle }}>
                                    {user.isUser && (
                                        <div style={{
                                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '3px',
                                            backgroundColor: COLORS.signal,
                                            boxShadow: '0 0 10px #00E676'
                                        }} />
                                    )}
                                    <div style={{ ...STYLES.rankCol, color: rankStyle.color }}>
                                        {rankStyle.icon}
                                    </div>
                                    <div style={{
                                        ...STYLES.avatar,
                                        borderColor: user.isUser ? COLORS.signal : '#475569',
                                        color: user.isUser ? COLORS.signal : 'white'
                                    }}>
                                        {user.avatar}
                                    </div>
                                    <div style={STYLES.infoCol}>
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <span style={{ ...STYLES.name, color: user.rank <= 3 ? rankStyle.color : 'white' }}>
                                                {user.name}
                                            </span>
                                            {user.isUser && <span style={STYLES.youTag}>(TÚ)</span>}
                                        </div>
                                    </div>
                                    <div style={STYLES.pointsCol}>
                                        <div style={{ ...STYLES.points, color: user.isUser ? COLORS.signal : 'white' }}>
                                            {user.points}
                                        </div>
                                        <div style={STYLES.trendIcon}>
                                            {user.trend === 'up' && <TrendingUp size={12} color="#00E676" />}
                                            {user.trend === 'down' && <TrendingDown size={12} color="#FF1744" />}
                                            {user.trend === 'same' && <Minus size={12} color="#64748B" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="p-8 text-center text-slate-400">No hay datos disponibles</div>
                    )}
                </div>

                <div style={{ textAlign: 'center', marginTop: '20px', opacity: 0.6 }}>
                    <p style={{ fontSize: '10px', color: '#94A3B8' }}>
                        Mostrando top 50 de {selectedLeague.name}.
                    </p>
                </div>
            </div>

            {/* Cierre del overlay para cerrar el menú si haces clic fuera (Truco simple) */}
            {isDropdownOpen && (
                <div
                    onClick={() => setIsDropdownOpen(false)}
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 15 }}
                />
            )}

            {isTieBreakerOpen && (
                <TieBreakerDialog
                    isOpen={isTieBreakerOpen}
                    onClose={() => setIsTieBreakerOpen(false)}
                    leagueId={selectedLeagueId}
                    currentGuess={ranking.find(u => u.isUser)?.tieBreakerGuess}
                    onSuccess={() => window.location.reload()}
                />
            )}

        </div>
    );
};