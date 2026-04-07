import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import TieBreakerDialog from '@/components/TieBreakerDialog';

interface RankingUser {
    rank: number;
    name: string;
    points: number;
    provisionalPoints?: number;
    avatar: string;
    isUser: boolean;
    trend: 'up' | 'down' | 'same';
    tieBreakerGuess?: number;
    breakdown?: {
        matches: number;
        phases: number;
        wildcard: number;
        bonus: number;
    };
}

interface SocialRankingTableProps {
    leagueId: string;
}

export const SocialRankingTable = ({ leagueId }: SocialRankingTableProps) => {
    const { user } = useAppStore();
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const STYLES = {
        // ... (Styles similar to RankingView but simplified/Tailwind-focused)
    };

    const getRankStyle = (rank: number, isLast: boolean) => {
        if (isLast) return { color: '#EF5350', icon: <span className="text-xl">🥄</span> };
        if (rank === 1) return { color: '#FACC15', icon: <Trophy size={18} className="text-yellow-400" /> };
        if (rank === 2) return { color: '#E2E8F0', icon: <Trophy size={16} className="text-slate-400" /> };
        if (rank === 3) return { color: '#B45309', icon: <Trophy size={16} className="text-amber-700" /> };
        return { color: '#64748B', icon: <span className="text-sm">{rank}</span> };
    };

    useEffect(() => {
        const mapData = (dataArray: any[]) => dataArray.map((item: any, index: number) => ({
            rank: index + 1,
            name: item.nickname || item.user?.nickname || item.fullName || 'Anónimo',
            points: item.totalPoints || 0,
            provisionalPoints: item.provisionalPoints || 0,
            avatar: (item.nickname || item.user?.nickname || item.fullName || '?').substring(0, 2).toUpperCase(),
            isUser: (item.id === user?.id) || (item.user?.id === user?.id),
            trend: 'same' as const,
            tieBreakerGuess: item.tieBreakerGuess,
            breakdown: item.breakdown
        }));

        const fetchRanking = async () => {
            setLoading(true);
            try {
                const endpoint = leagueId === 'global' ? '/leagues/global/ranking' : `/leagues/${leagueId}/ranking`;
                const { data } = await api.get(endpoint);
                const mappedRanking = Array.isArray(data) ? mapData(data) : [];
                setRanking(mappedRanking);
            } catch (error) {
                console.error('[Social] Error fetching ranking:', error);
                setRanking([]);
            } finally {
                setLoading(false);
            }
        };

        const fetchLiveRanking = async () => {
            try {
                const endpoint = leagueId === 'global' ? '/leagues/global/ranking/live' : `/leagues/${leagueId}/ranking/live`;
                const { data } = await api.get(endpoint);
                if (data) {
                    setIsLiveActive(Boolean(data.isLive));
                    if (data.ranking && Array.isArray(data.ranking)) {
                        setRanking(mapData(data.ranking));
                    }
                }
            } catch (error) {
                console.error('[Social] Error fetching LIVE ranking:', error);
            }
        };

        if (user && leagueId) {
            // Carga inicial
            fetchRanking().then(() => {
                // Inmediato lanza el test del en-vivo
                fetchLiveRanking();
            });

            // Polling cada 60s sin recargar (LoadingSpinner)
            const interval = setInterval(() => {
                fetchLiveRanking();
            }, 60000);

            return () => clearInterval(interval);
        }
    }, [leagueId, user]);

    const [visibleCount, setVisibleCount] = useState(10);
    const [isLiveActive, setIsLiveActive] = useState(false);
    
    // ... useEffect ...

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 10);
    };

    const visibleRanking = ranking.slice(0, visibleCount);

    return (
        <div className="w-full pb-24 md:pb-8 px-0 pt-4">
            <div className="flex flex-col items-center justify-center mb-4">
                <h2 className="font-russo text-xl text-white uppercase text-center flex items-center gap-2">
                    Ranking de Amigos
                    {isLiveActive && (
                        <span className="animate-pulse bg-red-500/20 text-red-500 border border-red-500 px-2 flex items-center rounded-sm text-[10px] whitespace-nowrap">
                            🔴 EN VIVO
                        </span>
                    )}
                </h2>
                {isLiveActive && (
                    <p className="text-[10px] text-slate-400 text-center mt-1 w-[80%] max-w-sm">
                        🔴 Puntos provisionales basados en marcador actual. Se oficializan al terminar el partido.
                    </p>
                )}
            </div>

            {/* Tie Breaker Button */}
            <div className="flex justify-center mb-4">
                <button
                    onClick={() => setIsTieBreakerOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all
                        ${ranking.find(u => u.isUser)?.tieBreakerGuess != null
                            ? 'bg-slate-800 text-slate-400 border border-slate-700'
                            : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/50 shadow-[0_0_15px_rgba(250,204,21,0.2)]'
                        }`}
                >
                    {ranking.find(u => u.isUser)?.tieBreakerGuess != null
                        ? `Tie-Breaker: ${ranking.find(u => u.isUser)?.tieBreakerGuess} Goles`
                        : '⚠️ Configurar Desempate'}
                </button>
            </div>

            <div className="bg-[#1E293B] rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
                <div className="flex justify-between p-3 bg-slate-900 border-b border-slate-700 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Posición / Usuario</span>
                    <span>Puntos</span>
                </div>

                {loading ? (
                    <div className="p-8 text-center text-slate-400 animate-pulse">Cargando...</div>
                ) : visibleRanking.length > 0 ? (
                    <>
                        {visibleRanking.map((item, index) => {
                            const isLast = index === visibleRanking.length - 1 && visibleRanking.length > 1;
                            const rankStyle = getRankStyle(item.rank, isLast);
                            const isExpanded = expandedRow === item.rank;

                            return (
                                <React.Fragment key={item.rank}>
                                    <div
                                        className={`flex items-center p-3 relative cursor-pointer
                                            ${item.isUser ? 'bg-[rgba(0,230,118,0.08)]' : ''}
                                            ${isExpanded ? '' : 'border-b border-slate-700/50'}`}
                                        onClick={() => setExpandedRow(isExpanded ? null : item.rank)}
                                    >
                                        {item.isUser && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00E676] shadow-[0_0_8px_#00E676]" />
                                        )}

                                        <div className="w-8 flex justify-center items-center mr-2 font-russo text-base">
                                            {rankStyle.icon}
                                        </div>

                                        <div className={`w-8 h-8 rounded-full bg-slate-800 border ${item.isUser ? 'border-[#00E676]' : 'border-slate-600'} flex items-center justify-center text-[10px] font-bold text-white mr-3`}>
                                            {item.avatar}
                                        </div>

                                        <div className="flex-1 flex flex-col justify-center">
                                            <div className="flex items-center">
                                                <span className={`text-sm font-bold ${item.rank <= 3 ? 'text-white' : 'text-slate-300'} ${item.isUser ? 'text-[#00E676]' : ''}`}>
                                                    {item.name}
                                                </span>
                                                {item.isUser && <span className="text-[8px] text-[#00E676] ml-2 uppercase font-extrabold">(TÚ)</span>}
                                            </div>
                                        </div>

                                        <div className="text-right flex items-center gap-2">
                                            <div className="flex flex-col items-end">
                                                <div className={`font-russo text-base ${item.isUser ? 'text-[#00E676]' : 'text-white'}`}>
                                                    {item.points}
                                                </div>
                                                {item.provisionalPoints && item.provisionalPoints > 0 ? (
                                                    <div className="text-[#00E676] text-[10px] font-bold animate-pulse -mt-1">
                                                        +{item.provisionalPoints} 🔴
                                                    </div>
                                                ) : null}
                                            </div>
                                            <ChevronDown 
                                                size={16} 
                                                className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    {isExpanded && item.breakdown && (
                                        <div className="bg-slate-900/50 p-4 border-b border-slate-700">
                                            {isLiveActive && item.provisionalPoints && item.provisionalPoints > 0 && (
                                                <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest mb-3">
                                                    🔴 El desglose incluye puntos provisionales del partido en vivo
                                                </p>
                                            )}
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div className={`flex flex-col items-center gap-1 p-2 rounded-lg ${isLiveActive && item.breakdown.matches > 0 ? 'bg-green-900/30 border border-green-800/40' : 'bg-slate-800/50'}`}>
                                                    <span className="text-xl">⚽</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Partidos</span>
                                                    <span className={`font-mono text-sm ${isLiveActive && item.breakdown.matches > 0 ? 'text-[#00E676]' : 'text-white'}`}>
                                                        {item.breakdown.matches}
                                                        {isLiveActive && item.provisionalPoints && item.provisionalPoints > 0 ? ' 🔴' : ''}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50">
                                                    <span className="text-xl">🔮</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Fases</span>
                                                    <span className="text-white font-mono text-sm">{item.breakdown.phases}</span>
                                                </div>
                                                <div className={`flex flex-col items-center gap-1 p-2 rounded-lg ${isLiveActive && item.breakdown.wildcard > 0 ? 'bg-yellow-900/20 border border-yellow-800/30' : 'bg-slate-800/50'}`}>
                                                    <span className="text-xl">⭐</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Comodín</span>
                                                    <span className={`font-mono text-sm ${item.breakdown.wildcard > 0 ? 'text-yellow-400' : 'text-white'}`}>
                                                        {item.breakdown.wildcard}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50">
                                                    <span className="text-xl">❓</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Bonus</span>
                                                    <span className="text-white font-mono text-sm">{item.breakdown.bonus}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </React.Fragment>
                            );
                        })}

                        {visibleCount < ranking.length && (
                            <div className="p-4 flex justify-center bg-slate-900/50">
                                <button 
                                    onClick={handleLoadMore}
                                    className="text-xs font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-700 hover:bg-slate-800 transition-all"
                                >
                                    Ver más ({ranking.length - visibleCount} restantes)
                                    <ChevronDown size={14} />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">No hay datos</div>
                )}
            </div>

            {isTieBreakerOpen && (
                <TieBreakerDialog
                    isOpen={isTieBreakerOpen}
                    onClose={() => setIsTieBreakerOpen(false)}
                    leagueId={leagueId}
                    currentGuess={ranking.find(u => u.isUser)?.tieBreakerGuess}
                    onSuccess={() => window.location.reload()}
                />
            )}
        </div>
    );
};
