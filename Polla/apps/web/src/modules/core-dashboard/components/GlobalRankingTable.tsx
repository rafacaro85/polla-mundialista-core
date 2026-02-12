import React, { useState, useEffect } from 'react';
import { Trophy, Crown, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { useTournament } from '@/hooks/useTournament';

interface RankingUser {
    rank: number;
    name: string;
    points: number;
    avatar: string;
    isUser: boolean;
    breakdown?: {
        matches: number;
        phases: number;
        wildcard: number;
        bonus: number;
    };
}

export const GlobalRankingTable = ({ tournamentId: propTournamentId }: { tournamentId?: string }) => {
    const { tournamentId: hookTournamentId } = useTournament();
    const tournamentId = propTournamentId || hookTournamentId;
    const { user } = useAppStore();
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(10);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);

    const handleLoadMore = () => {
        setVisibleCount((prev) => prev + 10);
    };

    const getRankStyle = (rank: number, isLast: boolean) => {
        if (isLast) return { color: '#EF5350', icon: <span className="text-xl">🥄</span> };
        if (rank === 1) return { color: '#FACC15', icon: <Trophy size={18} className="text-yellow-400" /> };
        if (rank === 2) return { color: '#E2E8F0', icon: <Trophy size={16} className="text-slate-400" /> };
        if (rank === 3) return { color: '#B45309', icon: <Trophy size={16} className="text-amber-700" /> };
        return { color: '#64748B', icon: <span className="text-sm">{rank}</span> };
    };

    useEffect(() => {
        const fetchGlobalRanking = async () => {
            if (!tournamentId) return;
            
            setLoading(true);
            try {
                console.log(`🌍 Fetching Global Ranking for ${tournamentId}...`);
                const { data } = await api.get('/leagues/global/ranking', {
                    params: { tournamentId }
                });
                
                console.log('✅ Global Ranking received:', data?.length);

                const mappedRanking: RankingUser[] = Array.isArray(data) ? data.map((item: any, index: number) => ({
                    rank: index + 1,
                    name: item.nickname || item.fullName || 'Anónimo',
                    points: Number(item.totalPoints || 0),
                    avatar: (item.nickname || item.fullName || '?').substring(0, 2).toUpperCase(),
                    isUser: (item.id === user?.id),
                    breakdown: item.breakdown
                })) : [];

                setRanking(mappedRanking);
            } catch (error) {
                console.error('❌ Error fetching global ranking:', error);
                setRanking([]);
            } finally {
                setLoading(false);
            }
        };

        fetchGlobalRanking();
        
        // Reset visible count only when tournament changes
        setVisibleCount(10);
    }, [user, tournamentId]);

    const visibleRanking = ranking.slice(0, visibleCount);

    return (
        <div className="w-full max-w-md mx-auto pb-24 px-4 pt-4">
            <h2 className="font-russo text-xl text-white uppercase text-center mb-6 flex items-center justify-center gap-2">
                <Crown className="text-yellow-500" /> Ranking Global
            </h2>

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
                                            <div className={`font-russo text-base ${item.isUser ? 'text-[#00E676]' : 'text-white'}`}>
                                                {item.points}
                                            </div>
                                            <ChevronDown 
                                                size={16} 
                                                className={`text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                            />
                                        </div>
                                    </div>

                                    {isExpanded && item.breakdown && (
                                        <div className="bg-slate-900/50 p-4 border-b border-slate-700">
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50">
                                                    <span className="text-xl">⚽</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Partidos</span>
                                                    <span className="text-white font-mono text-sm">{item.breakdown.matches}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50">
                                                    <span className="text-xl">🔮</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Fases</span>
                                                    <span className="text-white font-mono text-sm">{item.breakdown.phases}</span>
                                                </div>
                                                <div className="flex flex-col items-center gap-1 p-2 rounded-lg bg-slate-800/50">
                                                    <span className="text-xl">🃏</span>
                                                    <span className="text-xs text-slate-400 font-bold uppercase">Comodín</span>
                                                    <span className="text-white font-mono text-sm">{item.breakdown.wildcard}</span>
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
        </div>
    );
};
