'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
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

    const phaseNames: Record<string, string> = {
        'GROUP': 'Fase de Grupos',
        'ROUND_16': 'Octavos de Final',
        'QUARTER_FINAL': 'Cuartos de Final',
        'SEMI_FINAL': 'Semifinales',
        'FINAL': 'Final',
        'THIRD_PLACE': 'Tercer Puesto',
        'PLAYOFF_1': 'Playoffs (Ida)',
        'PLAYOFF_2': 'Playoffs (Vuelta)'
    };

    const phaseOrder = ['GROUP', 'PLAYOFF_1', 'PLAYOFF_2', 'ROUND_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'THIRD_PLACE', 'FINAL'];

    const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({});
    const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

    // Inicializar la última fase jugada por defecto
    useEffect(() => {
        if (matches.length > 0 && Object.keys(expandedPhases).length === 0) {
            // Obtener todos los phases únicos de los partidos
            const phasesPresent = Array.from(new Set(matches.map(m => m.phase || 'GROUP')));
            
            // Ordenar de más avanzado a menos para encontrar el "actual" o más reciente
            phasesPresent.sort((a, b) => {
                const orderA = phaseOrder.indexOf(a);
                const orderB = phaseOrder.indexOf(b);
                return orderB - orderA; // Descending (Final -> Grupos)
            });

            const mostAdvancedPhase = phasesPresent[0];
            if (mostAdvancedPhase) {
                setExpandedPhases({ [mostAdvancedPhase]: true });
                
                // Además, autoexpandir la primera fecha de esa fase
                const matchesOfPhase = matches.filter(m => (m.phase || 'GROUP') === mostAdvancedPhase);
                if (matchesOfPhase.length > 0) {
                    const firstDateStr = new Date(matchesOfPhase[0].date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                    });
                    const dateKey = firstDateStr.charAt(0).toUpperCase() + firstDateStr.slice(1);
                    setExpandedDates({ [`${mostAdvancedPhase}-${dateKey}`]: true });
                }
            }
        }
    }, [matches]);

    const groupedMatches = useMemo(() => {
        // Estructura: Record<Phase, Record<DateKey, Match[]>>
        const groups: Record<string, Record<string, Match[]>> = {};
        
        matches.forEach(m => {
            const phase = m.phase || 'GROUP';
            if (!groups[phase]) groups[phase] = {};
            
            const dateStr = new Date(m.date).toLocaleDateString('es-ES', {
                weekday: 'long',
                day: 'numeric',
                month: 'long'
            });
            const key = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
            if (!groups[phase][key]) groups[phase][key] = [];
            
            groups[phase][key].push(m);
        });

        // Ordenar partidos dentro de cada fecha por hora
        Object.keys(groups).forEach(phase => {
            Object.keys(groups[phase]).forEach(dateKey => {
                groups[phase][dateKey].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            });
        });

        return groups;
    }, [matches]);

    const sortedPhases = useMemo(() => {
        return Object.keys(groupedMatches).sort((a, b) => {
            const idxA = phaseOrder.indexOf(a);
            const idxB = phaseOrder.indexOf(b);
            // Default fallback if unknown phase: push to end
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });
    }, [groupedMatches]);

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
                <p className="text-slate-400 text-sm">Las predicciones de tus rivales se revelarán aquí una vez que los partidos estén bloqueados o finalizados.</p>
            </div>
        );
    }

    return (
        <div className="px-1 md:px-4 py-4 space-y-4 w-full max-w-full overflow-x-hidden">
            {sortedPhases.map(phase => {
                const datesObj = groupedMatches[phase];
                const dateKeys = Object.keys(datesObj).sort((a, b) => {
                    // Orden descendente (más recientes primero) dentro de la misma fase
                    return new Date(datesObj[b][0].date).getTime() - new Date(datesObj[a][0].date).getTime();
                });

                const isPhaseExpanded = expandedPhases[phase];
                const phaseTitle = phaseNames[phase] || phase;

                return (
                    <div key={phase} className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
                        
                        {/* BOTÓN DE FASE */}
                        <button 
                            onClick={() => setExpandedPhases(p => ({ ...p, [phase]: !p[phase] }))}
                            className="w-full flex items-center justify-between p-3 md:p-4 bg-slate-800 hover:bg-slate-700 transition-colors border-b border-[#334155]"
                        >
                            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider pl-1">
                                {phaseTitle}
                            </h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-bold bg-[#0F172A] px-2 py-1 rounded">
                                    {Object.values(datesObj).flat().length} Partidos
                                </span>
                                {isPhaseExpanded ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                            </div>
                        </button>

                        {/* CONTENIDO DE FASE */}
                        {isPhaseExpanded && (
                            <div className="p-2 md:p-4 space-y-5 bg-[#0F172A]">
                                {dateKeys.map(dateKey => {
                                    const expandedDateKey = `${phase}-${dateKey}`;
                                    const isDateExpanded = expandedDates[expandedDateKey];
                                    const matchesForDate = datesObj[dateKey];

                                    return (
                                        <div key={expandedDateKey} className="space-y-2">
                                            {/* BOTÓN DE FECHA */}
                                            <button 
                                                onClick={() => setExpandedDates(d => ({ ...d, [expandedDateKey]: !d[expandedDateKey] }))}
                                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                                            >
                                                <h3 className="text-xs md:text-sm font-bold text-[#00E676] uppercase tracking-widest text-left pl-1 border-l-2 border-[#00E676]">
                                                    {dateKey}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{matchesForDate.length} Partidos</span>
                                                    {isDateExpanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
                                                </div>
                                            </button>

                                            {/* LISTA DE PARTIDOS POR FECHA */}
                                            {isDateExpanded && (
                                                <div className="space-y-3 px-0 md:px-2 animate-in slide-in-from-top-2 duration-300">
                                                    {matchesForDate.map(match => {
                                                        const isExpanded = expandedMatchId === match.id;
                                                        const matchPredictions = predictions[match.id] || [];
                                                        const isLoading = loadingPredictions[match.id];
                                                        
                                                        const isFinished = ['FINISHED', 'COMPLETED'].includes(match.status);
                                                        const isLive = match.status === 'LIVE';

                                                        return (
                                                            <div key={match.id} className="bg-slate-800/40 border border-[#334155]/60 rounded-xl overflow-hidden transition-all">
                                                                {/* Cabecera del Partido */}
                                                                <button 
                                                                    onClick={() => handleExpandMatch(match.id)}
                                                                    className="w-full flex items-center justify-between py-3 px-2 md:p-4 hover:bg-slate-700/50 transition-colors focus:outline-none"
                                                                >
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex items-center justify-center gap-2 md:gap-4 w-full">
                                                                            <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                                                                <span className="text-xs md:text-sm font-bold text-white text-right truncate">
                                                                                    {match.homeTeam}
                                                                                </span>
                                                                                <img src={getTeamFlagUrl(match.homeTeam)} alt={match.homeTeam} className="w-5 md:w-6 h-auto rounded flex-shrink-0" />
                                                                            </div>
                                                                            
                                                                            <div className="flex flex-col items-center justify-center w-16 md:w-20 flex-shrink-0">
                                                                                {isFinished || isLive ? (
                                                                                    <span className={`font-russo tracking-wider text-base md:text-xl ${isLive ? 'text-[#00E676]' : 'text-slate-200'} whitespace-nowrap`}>
                                                                                        {match.homeScore} - {match.awayScore}
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                                                                                        Blocked
                                                                                    </span>
                                                                                )}
                                                                            </div>

                                                                            <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                                                                                <img src={getTeamFlagUrl(match.awayTeam)} alt={match.awayTeam} className="w-5 md:w-6 h-auto rounded flex-shrink-0" />
                                                                                <span className="text-xs md:text-sm font-bold text-white text-left truncate">
                                                                                    {match.awayTeam}
                                                                                </span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    <div className="ml-1 md:ml-4 text-slate-400 flex-shrink-0">
                                                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                                                    </div>
                                                                </button>

                                                                {/* Contenido de Rivales */}
                                                                {isExpanded && (
                                                                    <div className="border-t border-[#334155]/60 bg-[#0F172A]/80 p-0 md:p-4 pb-2">
                                                                        {isLoading ? (
                                                                            <div className="p-6 text-center text-slate-400 text-xs">Cargando rivales...</div>
                                                                        ) : matchPredictions.length === 0 ? (
                                                                            <div className="p-6 text-center text-slate-400 text-xs italic">Nadie ha pronosticado este partido aún.</div>
                                                                        ) : (
                                                                            <div className="w-full overflow-x-auto text-[11px] md:text-sm custom-scrollbar pb-1">
                                                                                <table className="w-full text-left border-collapse">
                                                                                    <thead>
                                                                                        <tr className="border-b border-[#334155] text-slate-400 text-[9px] md:text-xs uppercase tracking-wider bg-slate-800/50">
                                                                                            <th className="py-2 px-2 md:px-4 font-bold md:min-w-[150px]">Participante</th>
                                                                                            <th className="py-2 px-2 md:px-4 font-bold text-center">Score</th>
                                                                                            <th className="py-2 px-2 md:px-4 font-bold text-center whitespace-nowrap">Pts</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {matchPredictions.map((pred, i) => {
                                                                                            const hasPoints = pred.points !== null && pred.points !== undefined;
                                                                                            
                                                                                            return (
                                                                                                <tr key={pred.userId || i} className="border-b border-[#1E293B]/30 hover:bg-slate-800/30 transition-colors">
                                                                                                    <td className="py-2 px-2 md:px-4">
                                                                                                        <div className="flex items-center gap-2 md:gap-3">
                                                                                                            <div className="w-5 h-5 md:w-7 md:h-7 rounded-full bg-slate-700 overflow-hidden flex-shrink-0 border border-slate-600">
                                                                                                                {pred.avatarUrl ? (
                                                                                                                    <img src={pred.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                                                                                                ) : (
                                                                                                                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-[9px] md:text-xs font-bold uppercase">
                                                                                                                        {pred.fullName?.charAt(0) || '?'}
                                                                                                                    </div>
                                                                                                                )}
                                                                                                            </div>
                                                                                                            <span className="font-bold text-slate-200 truncate max-w-[80px] sm:max-w-[120px] md:max-w-xs text-xs md:text-sm">
                                                                                                                {pred.fullName || 'Usuario Válido'}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    </td>
                                                                                                    <td className="py-2 px-2 md:px-4 text-center border-l border-[#334155]/20">
                                                                                                        {pred.hasPrediction ? (
                                                                                                            <div className="inline-flex items-center gap-1 md:gap-2">
                                                                                                                {pred.isJoker && (
                                                                                                                    <span className="text-[10px] md:text-sm" title="Comodín activado">🃏</span>
                                                                                                                )}
                                                                                                                <span className="font-russo text-white text-xs md:text-base px-1.5 md:px-2 py-0.5 md:py-1 bg-[#1E293B] rounded border border-slate-700 shadow-inner">
                                                                                                                    {pred.homeScore}-{pred.awayScore}
                                                                                                                </span>
                                                                                                            </div>
                                                                                                        ) : (
                                                                                                            <span className="text-slate-500 text-[9px] md:text-xs italic">N/A</span>
                                                                                                        )}
                                                                                                    </td>
                                                                                                    <td className="py-2 px-1 md:px-4 text-center border-l border-[#334155]/20 bg-slate-800/10">
                                                                                                        {hasPoints ? (
                                                                                                            <span className={`font-black text-xs md:text-sm ${pred.points && pred.points > 0 ? 'text-[#00E676]' : 'text-slate-500'}`}>
                                                                                                                +{pred.points}
                                                                                                            </span>
                                                                                                        ) : (
                                                                                                            <span className="text-slate-600 text-xs md:text-sm">-</span>
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
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
