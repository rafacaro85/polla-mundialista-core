'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '@/lib/api';
import { ChevronDown, ChevronUp, Trophy, Search, X, Loader2, ArrowUpDown, Star, Gift } from 'lucide-react';
import { getTeamFlagUrl } from '@/shared/utils/flags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
    phase?: string;
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

interface PredictionResponse {
    data: Prediction[];
    total: number;
    page: number;
    hasMore: boolean;
    currentUser: Prediction | null;
}

export const RivalsView: React.FC<RivalsViewProps> = ({ leagueId, tournamentId }) => {
    const [matches, setMatches] = useState<Match[]>([]);
    const [loadingMatches, setLoadingMatches] = useState(true);

    const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
    const [summaryPredictions, setSummaryPredictions] = useState<Record<string, { top5: Prediction[], user: Prediction | null, total: number }>>({});
    const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>({});

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMatchId, setModalMatchId] = useState<string | null>(null);
    const [modalData, setModalData] = useState<Prediction[]>([]);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalPage, setModalPage] = useState(1);
    const [modalHasMore, setModalHasMore] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [modalSortBy, setModalSortBy] = useState<'points' | 'name'>('points');
    const [modalTotal, setModalTotal] = useState(0);

    // Bonus State
    const [bonusAnswers, setBonusAnswers] = useState<any[]>([]);
    const [loadingBonus, setLoadingBonus] = useState(false);

    useEffect(() => {
        if (!tournamentId) return;

        const fetchMatches = async () => {
            setLoadingMatches(true);
            try {
                const { data } = await api.get(`/matches?tournamentId=${tournamentId}`);
                if (Array.isArray(data)) {
                    const now = new Date().getTime();
                    // Filtrar partidos bloqueados manualmente, en curso/finalizados, o cuya fecha ya haya pasado
                    const lockedMatches = data.filter(
                        (m: any) => 
                            m.isManuallyLocked || 
                            ['FINISHED', 'LIVE', 'COMPLETED', 'IN_PLAY', 'PAUSED', 'HALFTIME'].includes(m.status) ||
                            new Date(m.date).getTime() <= now
                    );
                    setMatches(lockedMatches);
                }
            } catch (err) {
                console.error('Error fetching matches for rivals view:', err);
            } finally {
                setLoadingMatches(false);
            }
        };

        const fetchBonus = async () => {
            if (!leagueId) return;
            setLoadingBonus(true);
            try {
                const { data } = await api.get(`/bonus/league-answers?leagueId=${leagueId}`);
                setBonusAnswers(data);
            } catch (err) {
                console.error('Error fetching bonus answers:', err);
            } finally {
                setLoadingBonus(false);
            }
        };

        fetchMatches();
        fetchBonus();
    }, [tournamentId, leagueId]);

    const handleExpandMatch = async (matchId: string) => {
        if (expandedMatchId === matchId) {
            setExpandedMatchId(null);
            return;
        }

        setExpandedMatchId(matchId);

        if (!leagueId || summaryPredictions[matchId]) return;

        setLoadingSummary(prev => ({ ...prev, [matchId]: true }));
        try {
            // Fetch top 5 + current user
            const { data } = await api.get(`/predictions/league/${leagueId}/match/${matchId}?limit=5&sortBy=points`);
            const res = data as PredictionResponse;
            
            setSummaryPredictions(prev => ({ 
                ...prev, 
                [matchId]: { 
                    top5: res.data, 
                    user: res.currentUser,
                    total: res.total
                } 
            }));
        } catch (err) {
            console.error('Error fetching summary predictions:', err);
        } finally {
            setLoadingSummary(prev => ({ ...prev, [matchId]: false }));
        }
    };

    const openModal = (matchId: string) => {
        setModalMatchId(matchId);
        setModalData([]);
        setModalPage(1);
        setModalSearch('');
        setModalSortBy('points');
        setIsModalOpen(true);
        fetchModalData(matchId, 1, '', 'points', true);
    };

    const fetchModalData = async (matchId: string, page: number, search: string, sortBy: 'points' | 'name', reset: boolean = false) => {
        if (!leagueId) return;
        setModalLoading(true);
        try {
            const { data } = await api.get(`/predictions/league/${leagueId}/match/${matchId}?page=${page}&limit=25&search=${search}&sortBy=${sortBy}`);
            const res = data as PredictionResponse;
            
            setModalData(prev => reset ? res.data : [...prev, ...res.data]);
            setModalHasMore(res.hasMore);
            setModalTotal(res.total);
            setModalPage(res.page);
        } catch (err) {
            console.error('Error fetching modal data:', err);
        } finally {
            setModalLoading(false);
        }
    };

    const handleLoadMore = () => {
        if (!modalMatchId || modalLoading || !modalHasMore) return;
        fetchModalData(modalMatchId, modalPage + 1, modalSearch, modalSortBy);
    };

    const handleSearchChange = (val: string) => {
        setModalSearch(val);
        if (modalMatchId) {
            // Se puede agregar un debounce aquí si fuera necesario
            fetchModalData(modalMatchId, 1, val, modalSortBy, true);
        }
    };

    const handleSortChange = () => {
        const nextSort = modalSortBy === 'points' ? 'name' : 'points';
        setModalSortBy(nextSort);
        if (modalMatchId) {
            fetchModalData(modalMatchId, 1, modalSearch, nextSort, true);
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

    useEffect(() => {
        if (matches.length > 0 && Object.keys(expandedPhases).length === 0) {
            const phasesPresent = Array.from(new Set(matches.map(m => m.phase || 'GROUP')));
            phasesPresent.sort((a, b) => {
                const orderA = phaseOrder.indexOf(a);
                const orderB = phaseOrder.indexOf(b);
                return orderB - orderA;
            });

            const mostAdvancedPhase = phasesPresent[0];
            if (mostAdvancedPhase) {
                setExpandedPhases({ [mostAdvancedPhase]: true });
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

        Object.keys(groups).forEach(p => {
            Object.keys(groups[p]).forEach(dk => {
                groups[p][dk].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            });
        });
        return groups;
    }, [matches]);

    const sortedPhases = useMemo(() => {
        return Object.keys(groupedMatches).sort((a, b) => {
            const idxA = phaseOrder.indexOf(a);
            const idxB = phaseOrder.indexOf(b);
            return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
        });
    }, [groupedMatches]);

    // Regrupar bonus por pregunta para mostrar tablas por desafío
    const groupedByQuestion = useMemo(() => {
        if (!bonusAnswers || bonusAnswers.length === 0) return [];
        
        const questionsMap: Record<string, any[]> = {};
        bonusAnswers.forEach(user => {
            user.answers.forEach((ans: any) => {
                const qText = ans.questionText;
                if (!questionsMap[qText]) questionsMap[qText] = [];
                questionsMap[qText].push({
                    userId: user.userId,
                    fullName: user.fullName,
                    avatarUrl: user.avatarUrl,
                    answer: ans.answer,
                    pointsEarned: ans.pointsEarned
                });
            });
        });

        return Object.keys(questionsMap).map(qText => ({
            text: qText,
            participants: questionsMap[qText].sort((a, b) => (b.pointsEarned || 0) - (a.pointsEarned || 0))
        }));
    }, [bonusAnswers]);

    if (loadingMatches) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin h-8 w-8 text-[#00E676]" />
            </div>
        );
    }

    if (matches.length === 0) {
        return (
            <div className="text-center p-8 bg-[#1E293B] border border-[#334155] rounded-xl m-4">
                <Trophy size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                <h3 className="text-slate-300 font-bold mb-2">Aún no hay predicciones reveladas</h3>
                <p className="text-slate-400 text-sm">Las predicciones se revelarán cuando los partidos estén bloqueados o finalizados.</p>
            </div>
        );
    }

    const PredictionRow = ({ pred, isCurrentUser = false }: { pred: Prediction, isCurrentUser?: boolean }) => {
        const hasPoints = pred.points !== null && pred.points !== undefined;
        return (
            <tr className={`border-b border-[#1E293B]/30 hover:bg-slate-800/30 transition-colors ${isCurrentUser ? 'bg-[#00E676]/5 border-l-2 border-l-[#00E676]' : ''}`}>
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
                        <div className="flex flex-col min-w-0">
                            <span className={`font-bold truncate max-w-[80px] sm:max-w-[120px] md:max-w-xs text-xs md:text-sm ${isCurrentUser ? 'text-[#00E676]' : 'text-slate-200'}`}>
                                {pred.fullName || 'Usuario'}
                            </span>
                            {isCurrentUser && <span className="text-[8px] uppercase font-black text-[#00E676]/60">Tú</span>}
                        </div>
                    </div>
                </td>
                <td className="py-2 px-2 md:px-4 text-center border-l border-[#334155]/20">
                    {pred.hasPrediction ? (
                        <div className="inline-flex items-center gap-1">
                            {pred.isJoker && <span className="text-[10px] md:text-sm">🃏</span>}
                            <span className="font-russo text-white text-xs md:text-base px-1.5 py-0.5 bg-[#1E293B] rounded border border-slate-700">
                                {pred.homeScore}-{pred.awayScore}
                            </span>
                        </div>
                    ) : (
                        <span className="text-slate-500 text-[9px] italic">N/A</span>
                    )}
                </td>
                <td className="py-2 px-1 md:px-4 text-center border-l border-[#334155]/20">
                    {hasPoints ? (
                        <span className={`font-black text-xs md:text-sm ${pred.points && pred.points > 0 ? 'text-[#00E676]' : 'text-slate-500'}`}>
                            +{pred.points}
                        </span>
                    ) : (
                        <span className="text-slate-600 text-xs">-</span>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="px-1 md:px-4 py-4 space-y-4 w-full max-w-full overflow-x-hidden relative">
            {sortedPhases.map(phase => {
                const datesObj = groupedMatches[phase];
                const dateKeys = Object.keys(datesObj).sort((a, b) => new Date(datesObj[b][0].date).getTime() - new Date(datesObj[a][0].date).getTime());
                return (
                    <div key={phase} className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-sm">
                        <button 
                            onClick={() => setExpandedPhases(p => ({ ...p, [phase]: !p[phase] }))}
                            className="w-full flex items-center justify-between p-3 md:p-4 bg-slate-800 hover:bg-slate-700 transition-colors border-b border-[#334155]"
                        >
                            <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wider pl-1">{phaseNames[phase] || phase}</h2>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-slate-400 font-bold bg-[#0F172A] px-2 py-1 rounded">{Object.values(datesObj).flat().length} Partidos</span>
                                {expandedPhases[phase] ? <ChevronUp className="text-slate-400" /> : <ChevronDown className="text-slate-400" />}
                            </div>
                        </button>

                        {expandedPhases[phase] && (
                            <div className="p-2 md:p-4 space-y-5 bg-[#0F172A]">
                                {dateKeys.map(dateKey => {
                                    const expandedDateKey = `${phase}-${dateKey}`;
                                    const matchesForDate = datesObj[dateKey];
                                    return (
                                        <div key={expandedDateKey} className="space-y-2">
                                            <button 
                                                onClick={() => setExpandedDates(d => ({ ...d, [expandedDateKey]: !d[expandedDateKey] }))}
                                                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/60 transition-colors"
                                            >
                                                <h3 className="text-xs md:text-sm font-bold text-[#00E676] uppercase tracking-widest text-left pl-1 border-l-2 border-[#00E676]">{dateKey}</h3>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{matchesForDate.length} P.</span>
                                                    {expandedDates[expandedDateKey] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </div>
                                            </button>

                                            {expandedDates[expandedDateKey] && (
                                                <div className="space-y-3 px-0 md:px-2 animate-in slide-in-from-top-2 duration-300">
                                                    {matchesForDate.map(match => {
                                                        const isExpanded = expandedMatchId === match.id;
                                                        const summary = summaryPredictions[match.id];
                                                        const isLoading = loadingSummary[match.id];
                                                        const isFinished = ['FINISHED', 'COMPLETED'].includes(match.status);
                                                        const isLive = match.status === 'LIVE';

                                                        return (
                                                            <div key={match.id} className="bg-slate-800/40 border border-[#334155]/60 rounded-xl overflow-hidden shadow-lg transition-transform">
                                                                <button 
                                                                    onClick={() => handleExpandMatch(match.id)}
                                                                    className="w-full flex items-center justify-between py-3 px-2 md:p-4 hover:bg-slate-700/50 transition-colors"
                                                                >
                                                                    <div className="flex-1 flex items-center justify-center gap-2 md:gap-4 w-full">
                                                                        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
                                                                            <span className="text-xs md:text-sm font-bold text-white text-right truncate">{match.homeTeam}</span>
                                                                            <img src={getTeamFlagUrl(match.homeTeam)} alt="" className="w-5 md:w-6 rounded flex-shrink-0" />
                                                                        </div>
                                                                        <div className="flex flex-col items-center justify-center w-16 md:w-20">
                                                                            {isFinished || isLive ? (
                                                                                <span className={`font-russo text-base md:text-xl ${isLive ? 'text-[#00E676]' : 'text-slate-200'}`}>{match.homeScore} - {match.awayScore}</span>
                                                                            ) : (
                                                                                <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-900 px-1.5 py-0.5 rounded outline outline-1 outline-slate-700">Blocked</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 flex-1 justify-start min-w-0">
                                                                            <img src={getTeamFlagUrl(match.awayTeam)} alt="" className="w-5 md:w-6 rounded flex-shrink-0" />
                                                                            <span className="text-xs md:text-sm font-bold text-white text-left truncate">{match.awayTeam}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="ml-1 md:ml-4 text-slate-400">{isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
                                                                </button>

                                                                {isExpanded && (
                                                                    <div className="border-t border-[#334155]/60 bg-[#0F172A]/80">
                                                                        {isLoading ? (
                                                                            <div className="p-6 text-center text-slate-400 text-xs">Cargando participantes...</div>
                                                                        ) : !summary ? (
                                                                            <div className="p-6 text-center text-slate-400 text-xs italic">Error al cargar.</div>
                                                                        ) : summary.total === 0 ? (
                                                                            <div className="p-6 text-center text-slate-400 text-xs italic">Nadie ha pronosticado aún.</div>
                                                                        ) : (
                                                                            <div className="w-full">
                                                                                <table className="w-full text-left border-collapse">
                                                                                    <thead>
                                                                                        <tr className="border-b border-[#334155] text-slate-400 text-[9px] md:text-xs uppercase bg-slate-800/50">
                                                                                            <th className="py-2 px-2 md:px-4 font-bold">Participante</th>
                                                                                            <th className="py-2 px-2 md:px-4 font-bold text-center">Score</th>
                                                                                            <th className="py-2 px-2 md:px-4 font-bold text-center">Pts</th>
                                                                                        </tr>
                                                                                    </thead>
                                                                                    <tbody>
                                                                                        {summary.top5.map(pred => (
                                                                                            <PredictionRow key={pred.userId} pred={pred} isCurrentUser={pred.userId === summary.user?.userId} />
                                                                                        ))}
                                                                                        
                                                                                        {summary.user && !summary.top5.some(p => p.userId === summary.user?.userId) && (
                                                                                            <>
                                                                                                <tr className="bg-transparent"><td colSpan={3} className="py-1 text-center text-slate-600 text-[10px]">...</td></tr>
                                                                                                <PredictionRow pred={summary.user} isCurrentUser={true} />
                                                                                            </>
                                                                                        )}
                                                                                    </tbody>
                                                                                </table>
                                                                                
                                                                                <button 
                                                                                    onClick={() => openModal(match.id)}
                                                                                    className="w-full py-3 bg-slate-800/50 hover:bg-[#00E676]/10 text-[#00E676] text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                                                                                >
                                                                                    Ver todos ({summary.total})
                                                                                </button>
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

            {/* SECCIÓN BONUS */}
            <div className="mt-8 space-y-6 pb-20">
                <div className="flex items-center gap-3 px-2">
                    <div className="p-2 bg-[#FACC15]/10 border border-[#FACC15]/30 rounded-lg">
                        <Star size={20} className="text-[#FACC15]" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">Preguntas Bonus</h2>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Desafíos Revelados</p>
                    </div>
                </div>

                {loadingBonus ? (
                    <div className="p-10 text-center"><Loader2 className="animate-spin h-6 w-6 text-[#00E676] mx-auto" /></div>
                ) : groupedByQuestion.length > 0 ? (
                    groupedByQuestion.map((q, idx) => (
                        <div key={idx} className="bg-[#1E293B] border border-[#334155] rounded-2xl overflow-hidden shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="p-4 bg-slate-800/50 border-b border-[#334155]">
                                <h3 className="text-sm md:text-base font-bold text-[#00E676] leading-tight">
                                    <span className="text-slate-500 mr-2">#{idx + 1}</span>
                                    {q.text}
                                </h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-[#334155] text-slate-500 text-[10px] uppercase bg-slate-900/40">
                                            <th className="py-2 px-4 font-black">Participante</th>
                                            <th className="py-2 px-4 font-black text-center">Respuesta</th>
                                            <th className="py-2 px-4 font-black text-center">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {q.participants.map((p: any, pIdx: number) => {
                                            const myUserId = summaryPredictions[expandedMatchId || '']?.user?.userId || bonusAnswers.find(b => b.fullName === 'Tú' || false)?.userId;
                                            
                                            return (
                                                <tr key={pIdx} className={`border-b border-[#334155]/20 hover:bg-slate-800/40 transition-colors ${p.userId === myUserId ? 'bg-[#00E676]/5 border-l-2 border-l-[#00E676]' : ''}`}>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-slate-700 overflow-hidden border border-slate-600 flex-shrink-0">
                                                                {p.avatarUrl ? <img src={p.avatarUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400 font-bold">{p.fullName?.charAt(0)}</div>}
                                                            </div>
                                                            <span className="text-xs md:text-sm font-bold text-slate-200 truncate max-w-[120px]">{p.fullName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-l border-[#334155]/10">
                                                        <span className="text-xs font-medium text-white px-2 py-1 bg-slate-900 rounded border border-slate-700">
                                                            {p.answer}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 px-4 text-center border-l border-[#334155]/10">
                                                        <span className={`text-xs font-black ${p.pointsEarned > 0 ? 'text-[#00E676]' : 'text-slate-500'}`}>
                                                            +{p.pointsEarned}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center p-8 bg-[#1E293B]/50 border border-[#334155]/50 border-dashed rounded-2xl">
                        <Gift size={32} className="mx-auto text-slate-600 mb-3 opacity-30" />
                        <p className="text-slate-400 text-xs italic">Los resultados del bonus se revelarán cuando sean calificados.</p>
                    </div>
                )}
            </div>

            {/* MODAL VER TODOS */}
            {isModalOpen && modalMatchId && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0F172A]/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                        className="bg-[#1E293B] w-full max-w-2xl h-[85vh] rounded-3xl border border-[#334155] shadow-2xl flex flex-col relative overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header Modal */}
                        <div className="p-6 border-b border-[#334155] bg-slate-800/50 flex items-center justify-between">
                            <div className="flex flex-col">
                                <h2 className="text-lg md:text-xl font-black text-white uppercase italic tracking-tighter">
                                    Participantes <span className="text-[#00E676] text-xs block md:inline md:ml-2 not-italic">({modalTotal})</span>
                                </h2>
                                <p className="text-[10px] text-slate-500 uppercase mt-1">Predictions Revealed</p>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-full hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                            >
                                <X size={24} />
                            </Button>
                        </div>

                        {/* Search & Sort */}
                        <div className="p-4 bg-[#0F172A]/40 border-b border-[#334155]/60 flex flex-col md:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                                <Input 
                                    placeholder="Buscar participante..."
                                    className="pl-10 bg-slate-800/50 border-white/5 text-white h-10 text-sm rounded-xl focus:ring-[#00E676]"
                                    value={modalSearch}
                                    onChange={e => handleSearchChange(e.target.value)}
                                />
                            </div>
                            <Button 
                                variant="outline" 
                                onClick={handleSortChange}
                                className="bg-slate-800 border-white/10 text-xs font-bold gap-2 uppercase tracking-widest text-[#00E676]"
                            >
                                <ArrowUpDown size={14} />
                                {modalSortBy === 'points' ? 'Por Puntos' : 'Por Nombre'}
                            </Button>
                        </div>

                        {/* Lista de Predicciones */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-[#1E293B] shadow-lg">
                                    <tr className="text-slate-500 text-[10px] uppercase font-black bg-slate-900/80 backdrop-blur">
                                        <th className="py-3 px-4">Participante</th>
                                        <th className="py-3 px-4 text-center">Score</th>
                                        <th className="py-3 px-4 text-center">Pts</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {modalData.map((pred, i) => (
                                        <PredictionRow 
                                            key={`${pred.userId}-${i}`} 
                                            pred={pred} 
                                            isCurrentUser={pred.userId === (summaryPredictions[modalMatchId]?.user?.userId || '')} 
                                        />
                                    ))}
                                    
                                    {modalLoading && (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center">
                                                <Loader2 className="animate-spin h-6 w-6 text-[#00E676] mx-auto" />
                                            </td>
                                        </tr>
                                    )}

                                    {!modalLoading && modalData.length === 0 && (
                                        <tr>
                                            <td colSpan={3} className="py-20 text-center flex flex-col items-center">
                                                <Search size={40} className="text-slate-800 mb-2" />
                                                <p className="text-slate-500 italic text-sm">No se encontraron resultados para "{modalSearch}"</p>
                                            </td>
                                        </tr>
                                    )}

                                    {modalHasMore && !modalLoading && (
                                        <tr>
                                            <td colSpan={3} className="p-4">
                                                <Button 
                                                    onClick={handleLoadMore}
                                                    variant="ghost" 
                                                    className="w-full bg-[#00E676]/5 text-[#00E676] hover:bg-[#00E676]/10 font-bold uppercase text-xs"
                                                >
                                                    Cargar más participantes
                                                </Button>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
