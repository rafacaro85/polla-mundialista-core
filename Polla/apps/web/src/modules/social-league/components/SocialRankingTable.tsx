import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import TieBreakerDialog from '@/components/TieBreakerDialog';

interface RankingUser {
    rank: number;
    name: string;
    points: number;
    avatar: string;
    isUser: boolean;
    trend: 'up' | 'down' | 'same';
    tieBreakerGuess?: number;
}

interface SocialRankingTableProps {
    leagueId: string;
}

export const SocialRankingTable = ({ leagueId }: SocialRankingTableProps) => {
    const { user } = useAppStore();
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

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
        const fetchRanking = async () => {
            setLoading(true);
            try {
                // Determine endpoint based on leagueId (if 'global' passed by mistake, handle it, but this is Social)
                const endpoint = leagueId === 'global' ? '/leagues/global/ranking' : `/leagues/${leagueId}/ranking`;
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
                console.error('[Social] Error fetching ranking:', error);
                setRanking([]);
            } finally {
                setLoading(false);
            }
        };

        if (user && leagueId) {
            fetchRanking();
        }
    }, [leagueId, user]);

    return (
        <div className="w-full max-w-md mx-auto pb-24 px-4 pt-4">
            <h2 className="font-russo text-xl text-white uppercase text-center mb-4">
                Ranking de Amigos
            </h2>

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
                ) : ranking.length > 0 ? (
                    ranking.map((item, index) => {
                        const isLast = index === ranking.length - 1 && ranking.length > 1;
                        const rankStyle = getRankStyle(item.rank, isLast);

                        return (
                            <div
                                key={item.rank}
                                className={`flex items-center p-3 border-b border-slate-700/50 relative
                                    ${item.isUser ? 'bg-[rgba(0,230,118,0.08)]' : ''}`}
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

                                <div className="text-right">
                                    <div className={`font-russo text-base ${item.isUser ? 'text-[#00E676]' : 'text-white'}`}>
                                        {item.points}
                                    </div>
                                </div>
                            </div>
                        );
                    })
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
