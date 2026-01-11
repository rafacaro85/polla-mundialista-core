'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import DateFilter from '@/components/DateFilter';
import { Loader2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PhaseProgressDashboard } from '@/components/PhaseProgressDashboard';
import { AiSuggestionsButton } from '@/components/AiSuggestionsButton';
import { useMyPredictions } from '@/shared/hooks/useMyPredictions';
import { DynamicPredictionsWrapper } from '@/components/DynamicPredictionsWrapper';
import { getTeamFlagUrl } from '@/shared/utils/flags';

// Helper to ensure flag is a URL
const ensureFlagUrl = (flag: string | null | undefined, teamName: string) => {
    if (flag && (flag.startsWith('http') || flag.startsWith('/'))) return flag;
    if (flag && flag.length <= 3) return `https://flagcdn.com/h80/${flag}.png`;
    return getTeamFlagUrl(teamName);
};

export const EnterpriseFixture = () => {
    const params = useParams();
    const leagueId = params.id as string;

    // Using leagueId (not 'global') to ensure predictions are scoped to this enterprise league
    const { predictions, savePrediction, saveBulkPredictions, deletePrediction, clearAllPredictions, refresh: refreshPredictions, loading: loadingPredictions } = useMyPredictions(leagueId);

    const [rawMatches, setRawMatches] = useState<any[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, { h: number, a: number }>>({});
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchMatches = async () => {
        try {
            const { data } = await api.get(`/leagues/${leagueId}/matches`);
            // Frontend safeguard filter (same as Social)
            // const filteredData = (data || []).filter((m: any) => new Date(m.date) <= new Date('2026-06-28T12:00:00Z'));
            setRawMatches(data || []);
        } catch (error) {
            console.error('Error fetching matches:', error);
            toast.error('Error al cargar los partidos');
        } finally {
            setLoadingMatches(false);
        }
    };

    useEffect(() => {
        if (leagueId) {
            fetchMatches();
        }
    }, [leagueId]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchMatches(), refreshPredictions()]);
        setIsRefreshing(false);
    };

    // Merge Logic (Identical to SocialFixture)
    const matches = useMemo(() => {
        if (!rawMatches.length) return [];

        return rawMatches.map((m: any) => {
            const date = new Date(m.date);
            const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const dateStr = `${month} ${day}`;
            const displayDate = dateStr;

            const pred = predictions[m.id];
            const suggestion = aiSuggestions[m.id];

            let userH = '';
            let userA = '';

            if (suggestion) {
                userH = suggestion.h.toString();
                userA = suggestion.a.toString();
            } else if (pred) {
                userH = pred.homeScore?.toString() ?? '';
                userA = pred.awayScore?.toString() ?? '';
            }

            return {
                ...m,
                dateStr,
                displayDate,
                homeTeam: m.homeTeam,
                awayTeam: m.awayTeam,
                homeFlag: ensureFlagUrl(m.homeFlag, m.homeTeam || m.homeTeamPlaceholder),
                awayFlag: ensureFlagUrl(m.awayFlag, m.awayTeam || m.awayTeamPlaceholder),
                status: m.status === 'COMPLETED' ? 'FINISHED' : m.status,
                scoreH: m.homeScore,
                scoreA: m.awayScore,
                prediction: pred ? {
                    homeScore: pred.homeScore,
                    awayScore: pred.awayScore,
                    isJoker: pred.isJoker,
                    points: pred.points || 0
                } : undefined,
                userH,
                userA,
                points: pred?.points || 0
            };
        });
    }, [rawMatches, predictions, aiSuggestions]);

    // Update dates logic
    useEffect(() => {
        if (matches.length > 0) {
            const uniqueDates = Array.from(new Set(matches.map((m: any) => m.displayDate))) as string[];
            setDates(uniqueDates);
            // If no selection or current selection invalid
            if (!selectedDate || !uniqueDates.includes(selectedDate)) {
                setSelectedDate(uniqueDates[0]);
            }
        }
    }, [matches, selectedDate]);

    // Filter matches by selected date
    const filteredMatches = useMemo(() =>
        matches.filter(m => m.displayDate === selectedDate),
        [matches, selectedDate]
    );

    const currentPhase = useMemo(() => {
        if (matches.length === 0) return 'GROUP';
        const phases = filteredMatches.map(m => m.phase).filter(Boolean);
        // Simple logic: return the phase of the first match in the view, or GROUP
        return phases[0] || 'GROUP';
    }, [matches, filteredMatches]);

    const handlePhaseClick = (phase: string) => {
        const phaseMatches = matches.filter(m => m.phase === phase);
        if (phaseMatches.length > 0) {
            const firstMatch = phaseMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            setSelectedDate(firstMatch.displayDate);
            toast.info(`Navegando a ${phase}`);
        } else {
            toast.error('No hay partidos para esta fase');
        }
    };

    const handlePredictionChange = async (matchId: string, homeScore: any, awayScore: any, isJoker?: boolean) => {
        // Clear suggestion if manually acted upon
        if (aiSuggestions[matchId]) {
            const next = { ...aiSuggestions };
            delete next[matchId];
            setAiSuggestions(next);
        }

        if (homeScore === null && awayScore === null) {
            await deletePrediction(matchId);
            return;
        }

        const match = matches.find(m => m.id === matchId);
        await savePrediction(matchId, parseInt(homeScore), parseInt(awayScore), isJoker, match?.phase);
    };

    const handleAiPredictions = (newPredictions: { [matchId: string]: [number, number] }) => {
        const suggestionsMap: Record<string, { h: number, a: number }> = {};
        Object.entries(newPredictions).forEach(([mId, [h, a]]) => {
            const existing = predictions[mId];
            if (!existing || existing.leagueId === null) {
                suggestionsMap[mId] = { h, a };
            }
        });
        setAiSuggestions(prev => ({ ...prev, ...suggestionsMap }));
        toast.info('Sugerencias aplicadas (Borrador)');
    };

    const handleClearPredictions = () => {
        setAiSuggestions({});
        toast.info('Sugerencias limpiadas');
    };

    const handleSaveAiPredictions = async () => {
        await saveBulkPredictions(aiSuggestions);
        setAiSuggestions({});
    };

    if (loadingMatches && loadingPredictions) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00E676]" size={48} />
            </div>
        );
    }

    return (
        <DynamicPredictionsWrapper currentPhase={currentPhase}>
            <div className="min-h-screen bg-transparent pb-24 md:pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="max-w-4xl mx-auto px-4 pt-4 mb-6">
                    <PhaseProgressDashboard onPhaseClick={handlePhaseClick} />
                    <div className="mt-4 flex justify-center">
                        <AiSuggestionsButton
                            matches={matches}
                            onPredictionsGenerated={handleAiPredictions}
                            onClear={handleClearPredictions}
                            onSave={handleSaveAiPredictions}
                        />
                        <Button
                            onClick={async () => {
                                if (confirm('¿Estás seguro de que deseas borrar TODAS tus predicciones en esta liga? Esta acción no se puede deshacer.')) {
                                    await clearAllPredictions();
                                    if (dates.length > 0) {
                                        setSelectedDate(dates[0]);
                                    }
                                }
                            }}
                            variant="ghost"
                            className="ml-2 text-red-500 hover:text-red-400 hover:bg-red-500/10 text-xs font-bold uppercase tracking-widest transition-colors"
                            size="sm"
                        >
                            Limpiar Todo
                        </Button>
                    </div>
                </div>

                <div className="max-w-4xl mx-auto px-4 space-y-4">
                    <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex-1 overflow-x-auto">
                            <DateFilter
                                dates={dates}
                                selectedDate={selectedDate}
                                onSelect={setSelectedDate}
                            />
                        </div>
                        <Button
                            onClick={handleRefresh}
                            variant="outline"
                            size="icon"
                            className="shrink-0 bg-[#1E293B] border-white/10 hover:bg-[#334155] text-slate-400 hover:text-[#00E676]"
                            title="Actualizar Marcadores"
                        >
                            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>

                    {filteredMatches.length > 0 ? (
                        filteredMatches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                showInputs={true}
                                onSavePrediction={handlePredictionChange}
                            />
                        ))
                    ) : (
                        <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-12 text-center shadow-lg">
                            <p className="text-slate-400 text-sm font-medium italic">
                                {selectedDate
                                    ? `No hay partidos para ${selectedDate}`
                                    : 'No hay partidos disponibles'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </DynamicPredictionsWrapper>
    );
};
