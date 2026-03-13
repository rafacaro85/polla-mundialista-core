'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/lib/api';
import { ChevronDown, ChevronUp, Trophy } from 'lucide-react';
import { getTeamFlagUrl } from '@/shared/utils/flags';

interface RivalsViewProps {
    leagueId?: string;
    tournamentId?: string;
}

interface Match {
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore?: number | null;
    awayScore?: number | null;
    status: string;
    date: string;
    isManuallyLocked: boolean;
    group?: string;
}

interface Prediction {
    userId: string;
    fullName: string;
    avatarUrl: string | null;
    homeScore: number | null;
    awayScore: number | null;
    points: number | null;
    isJoker: boolean;
    hasPrediction: boolean;
}

export const RivalsView: React.FC<RivalsViewProps> = ({ leagueId, tournamentId }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
    const [predictions, setPredictions] = useState<Record<string, Prediction[]>>({});
    const [loadingPredictions, setLoadingPredictions] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (!tournamentId) return;

        const fetchMatches = async () => {
            setLoadingMatches(true);
            try {
                const { data } = await api.get(`/matches?tournamentId=${tournamentId}`);
                if (Array.isArray(data)) {
                    // Filtrar partidos bloqueados o en curso/finalizados
                    const lockedMatches = data.filter(
                        (m: any) => m.isManuallyLocked || ['FINISHED', 'LIVE', 'COMPLETED'].includes(m.status)
                    );
                    setMatches(lockedMatches);
                }
            } catch (err) {
                console.error('Error fetching matches for rivals view:', err);
            } finally {
                setLoadingMatches(false);
            }
        };

        fetchMatches();
    }, [tournamentId]);

    const handleExpandMatch = async (matchId: string) => {
        if (expandedMatchId === matchId) {
            setExpandedMatchId(null);
            return;
        }

        setExpandedMatchId(matchId);

        if (!leagueId || predictions[matchId]) return; // ya están cargadas

        setLoadingPredictions(prev => ({ ...prev, [matchId]: true }));
        try {
            const { data } = await api.get(`/predictions/league/${leagueId}/match/${matchId}`);
            
            // Ordenar por puntos (mayor a menor)
            const sortedData = (data || []).sort((a: Prediction, b: Prediction) => {
                const ptsA = a.points || 0;
                const ptsB = b.points || 0;
                return ptsB - ptsA;
            });

            setPredictions(prev => ({ ...prev, [matchId]: sortedData }));
        } catch (err) {
            console.error('Error fetching predictions for match:', err);
        } finally {
            setLoadingPredictions(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const groupedMatches = useMemo(() => {
        const groups: Record<string, Match[]> = {};
        matches.forEach(m => {
            const dateStr = new Date(m.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            const key = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            if (!groups[key]) groups[key] = [];
            groups[key].push(m);
        });

        // Ordenar partidos dentro de cada grupo por fecha
        Object.keys(groups).forEach(key => {
            groups[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        // Ordenar grupos por fecha (descendente, los más recientes primero)
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            return new Date(groups[b][0].date).getTime() - new Date(groups[a][0].date).getTime();
        });

        const sortedGroups: Record<string, Match[]> = {};
        sortedKeys.forEach(k => {
            sortedGroups[k] = groups[k];
        });

        return sortedGroups;
    }, [matches]);

    if (loadingMatches) {
        return (
            <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00E676]"></div>
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="text-center p-8 bg-[#1E293B] border border-[#334155] rounded-xl m-4">
                <Trophy size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                <h3 className="text-slate-300 font-bold mb-2">Aún no hay predicciones reveladas</h3>
                <p className="text-slate-400 text-sm">
                    Las predicciones de tus rivales se revelarán aquí una vez que los partidos comiencen o se bloqueen manualmente.
                </p>
            </div>
        );
    }

    return (
        <div className="p-4 space-y-6">
            {Object.keys(groupedMatches).map(dateKey => (
                <div key={dateKey} className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-2">
                        {dateKey}
                    </h3>
                    
                    <div className="space-y-3">
                        {groupedMatches[dateKey].map(match => {
                            const isExpanded = expandedMatchId === match.id;
                            const matchPredictions = predictions[match.id] || [];
                            const isLoading = loadingPredictions[match.id];
                            
                            const isFinished = ['FINISHED', 'COMPLETED'].includes(match.status);
                            const isLive = match.status === 'LIVE';

                            return (
                                <div key={match.id} className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden transition-all">
                                    {/* Cabecera del Accordion */}
                                    <button 
                                        onClick={() => handleExpandMatch(match.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors text-left focus:outline-none"
                                    >
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 md:gap-6">
                                                <div className="flex items-center gap-2 flex-1 justify-end">
                                                    <span className="text-sm md:text-base font-bold text-white text-right truncate">
                                                        {match.homeTeam}
                                                    </span>
                                                    <img src={getTeamFlagUrl(match.homeTeam)} alt={match.homeTeam} className="w-5 md:w-6 h-auto rounded shadow-sm" />
                                                </div>
                                                
                                                <div className="flex flex-col items-center min-w-[60px]">
                                                    {isFinished || isLive ? (
                                                        <span className={`font-russo text-lg md:text-xl ${isLive ? 'text-[#00E676]' : 'text-slate-200'}`}>
                                                            {match.homeScore} - {match.awayScore}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">
                                                            Bloqueado
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 flex-1 justify-start">
                                                    <img src={getTeamFlagUrl(match.awayTeam)} alt={match.awayTeam} className="w-5 md:w-6 h-auto rounded shadow-sm" />
                                                    <span className="text-sm md:text-base font-bold text-white text-left truncate">
                                                        {match.awayTeam}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="ml-4 text-slate-400">
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </button>

                                    {/* Contenido Expandido */}
                                    {isExpanded && (
                                        <div className="border-t border-[#334155] bg-[#0F172A] p-0 md:p-4 animate-in slide-in-from-top-2 duration-200">
                                            {isLoading ? (
                                                <div className="p-8 text-center text-slate-400 text-sm">
                                                    Cargando rivales...
                                                </div>
                                            ) : matchPredictions.length === 0 ? (
                                                <div className="p-8 text-center text-slate-400 text-sm">
                                                    Nadie ha pronosticado este partido aún.
                                                </div>
                                            ) : (
                                                <div className="overflow-x-auto w-full">
                                                    <table className="w-full min-w-[500px] text-left border-collapse mx-auto max-w-4xl text-sm">
                                                        <thead>
                                                            <tr className="border-b border-[#334155] text-slate-400 text-[10px] uppercase tracking-wider">
                                                                <th className="py-3 px-4 font-bold">Participante</th>
                                                                <th className="py-3 px-4 font-bold text-center">Predicción</th>
                                                                <th className="py-3 px-4 font-bold text-center bg-slate-800/30">Puntos</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {matchPredictions.map((pred, i) => {
                                                                const hasPoints = pred.points !== null && pred.points !== undefined;
                                                                
                                                                return (
                                                                    <tr key={pred.userId || i} className="border-b border-[#1E293B]/50 hover:bg-slate-800/30 transition-colors">
                                                                        <td className="py-3 px-4">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600">
                                                                                    {pred.avatarUrl ? (
                                                                                        <img src={pred.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                                                    ) : (
                                                                                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase">
                                                                                            {pred.fullName?.charAt(0) || '?'}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <span className="font-bold text-slate-200 truncate max-w-[150px] md:max-w-[200px]">
                                                                                    {pred.fullName || 'Usuario Válido'}
                                                                                </span>
                                                                            </div>
                                                                        </td>
                                                                        <td className="py-3 px-4 text-center border-l border-[#334155]/30">
                                                                            {pred.hasPrediction ? (
                                                                                <div className="inline-flex items-center gap-2">
                                                                                    {pred.isJoker && (
                                                                                        <span className="text-xl" title="Comodín activado">🃏</span>
                                                                                    )}
                                                                                    <span className="font-russo text-white text-base px-2 py-0.5 bg-slate-800 rounded">
                                                                                        {pred.homeScore} - {pred.awayScore}
                                                                                    </span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-slate-500 text-xs italic">Sin predicción</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-3 px-4 text-center border-l border-[#334155]/30 bg-slate-800/10">
                                                                            {hasPoints ? (
                                                                                <span className={`font-bold ${pred.points && pred.points > 0 ? 'text-[#00E676]' : 'text-slate-400'}`}>
                                                                                    +{pred.points} pts
                                                                                </span>
                                                                            ) : (
                                                                                <span className="text-slate-600 text-xs">-</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};
