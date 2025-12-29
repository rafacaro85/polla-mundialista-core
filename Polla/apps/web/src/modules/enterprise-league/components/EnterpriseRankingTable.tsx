import React, { useState, useEffect } from 'react';
import { Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import TieBreakerDialog from '@/components/TieBreakerDialog'; // We might need to duplicate this too later if logic differs

// --- INTERFACES ---
interface RankingUser {
    rank: number;
    name: string;
    points: number;
    avatar: string;
    isUser: boolean;
    trend: 'up' | 'down' | 'same';
    tieBreakerGuess?: number;
    members?: number; // For departments
}

/* =============================================================================
   COMPONENTE: ENTERPRISE RANKING TABLE (ISOLATED)
   - No Global Dropdown
   - Supports Department War if enabled
   ============================================================================= */
interface EnterpriseRankingTableProps {
    leagueId: string;
    enableDepartmentWar?: boolean;
}

export const EnterpriseRankingTable = ({ leagueId, enableDepartmentWar }: EnterpriseRankingTableProps) => {
    const { user } = useAppStore();
    const [ranking, setRanking] = useState<RankingUser[]>([]);
    const [deptRanking, setDeptRanking] = useState<RankingUser[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'departments'>('users');
    const [loading, setLoading] = useState(false);
    const [isTieBreakerOpen, setIsTieBreakerOpen] = useState(false);

    // SISTEMA DE DISEÑO EMPRESARIAL (Uses CSS variables injected by BrandProvider)
    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '100px',
            fontFamily: 'sans-serif'
        },
        // ... Styles simplified to use Tailwind classes mostly, but keeping structure
    };

    const getRankStyle = (rank: number, isLast: boolean) => {
        if (isLast) return { color: '#EF5350', icon: <span className="text-xl">🥄</span> };
        if (rank === 1) return { color: '#FACC15', icon: <Trophy size={18} className="text-yellow-400" /> };
        if (rank === 2) return { color: '#E2E8F0', icon: <Trophy size={16} className="text-slate-400" /> };
        if (rank === 3) return { color: '#B45309', icon: <Trophy size={16} className="text-amber-700" /> };
        return { color: '#64748B', icon: <span className="text-sm">{rank}</span> };
    };

    // Cargar Ranking
    useEffect(() => {
        const fetchRanking = async () => {
            setLoading(true);
            try {
                if (activeTab === 'departments') {
                    // Cargar Ranking de Departamentos
                    const { data } = await api.get(`/leagues/${leagueId}/analytics`);
                    const dRanking = (data.departmentRanking || []).map((d: any, i: number) => ({
                        rank: i + 1,
                        name: d.department,
                        points: parseFloat(d.avgPoints),
                        members: d.members,
                        avatar: d.department.substring(0, 2).toUpperCase(),
                        isUser: false,
                        trend: 'same'
                    }));
                    setDeptRanking(dRanking);
                } else {
                    // Cargar Ranking de Usuarios
                    const { data } = await api.get(`/leagues/${leagueId}/ranking`);

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
                }
            } catch (error) {
                console.error('[Enterprise] Error fetching ranking:', error);
                setRanking([]);
                setDeptRanking([]);
            } finally {
                setLoading(false);
            }
        };

        if (user && leagueId) {
            fetchRanking();
        }
    }, [leagueId, user, activeTab]);

    const currentList = activeTab === 'departments' ? deptRanking : ranking;

    return (
        <div className="w-full max-w-3xl mx-auto pb-24">
            <div className="mb-6 text-center">
                <h2 className="font-russo text-2xl text-white uppercase tracking-widest">
                    Tabla de Posiciones
                </h2>
            </div>

            {/* TABS DE GUERRA DE ÁREAS */}
            {enableDepartmentWar && (
                <div className="flex mb-6 bg-black/20 p-1 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg transition-all ${activeTab === 'users' ? 'bg-brand-primary text-brand-secondary shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Participantes
                    </button>
                    <button
                        onClick={() => setActiveTab('departments')}
                        className={`flex-1 py-2 text-sm font-bold uppercase rounded-lg transition-all ${activeTab === 'departments' ? 'bg-brand-primary text-brand-secondary shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Guerra de Áreas
                    </button>
                </div>
            )}

            <div className="bg-brand-secondary/50 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">
                <div className="flex justify-between p-4 bg-black/20 border-b border-white/5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span>Posición / {activeTab === 'departments' ? 'Área' : 'Usuario'}</span>
                    <span>{activeTab === 'departments' ? 'Promedio' : 'Puntos'}</span>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-slate-400 animate-pulse">Cargando datos...</div>
                ) : currentList.length > 0 ? (
                    currentList.map((item, index) => {
                        const isLast = index === currentList.length - 1 && currentList.length > 1;
                        const rankStyle = getRankStyle(item.rank, isLast);

                        return (
                            <div
                                key={item.rank}
                                className={`flex items-center p-4 border-b border-white/5 relative transition-colors hover:bg-white/5 ${item.isUser ? 'bg-brand-primary/10' : ''}`}
                            >
                                {item.isUser && (
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-primary shadow-[0_0_10px_var(--brand-primary)]" />
                                )}

                                <div className="w-8 flex justify-center items-center mr-3 font-russo text-lg">
                                    {rankStyle.icon}
                                </div>

                                <div className={`w-9 h-9 rounded-${activeTab === 'departments' ? 'lg' : 'full'} bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-white mr-3`}>
                                    {item.avatar}
                                </div>

                                <div className="flex-1 flex flex-col justify-center">
                                    <div className="flex items-center">
                                        <span className={`text-sm font-bold ${item.rank <= 3 ? 'text-white' : 'text-slate-200'} ${item.isUser ? 'text-brand-primary' : ''}`}>
                                            {item.name}
                                        </span>
                                        {item.isUser && <span className="text-[9px] text-brand-primary ml-2 uppercase tracking-wider font-extrabold">(TÚ)</span>}
                                    </div>
                                    {activeTab === 'departments' && (
                                        <span className="text-[10px] text-slate-500">
                                            {item.members} miembros
                                        </span>
                                    )}
                                </div>

                                <div className="text-right">
                                    <div className={`font-russo text-lg ${item.isUser ? 'text-brand-primary' : 'text-white'}`}>
                                        {item.points}
                                    </div>
                                    <div className="flex justify-end mt-0.5">
                                        {item.trend === 'up' && <TrendingUp size={12} className="text-green-500" />}
                                        {item.trend === 'down' && <TrendingDown size={12} className="text-red-500" />}
                                        {item.trend === 'same' && <Minus size={12} className="text-slate-500" />}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="p-12 text-center text-slate-500">No hay datos disponibles</div>
                )}
            </div>

            <div className="mt-4 text-center opacity-40 text-[10px] text-slate-400 uppercase">
                Ranking Actualizado
            </div>
        </div>
    );
};
