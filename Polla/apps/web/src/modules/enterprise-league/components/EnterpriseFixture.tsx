'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import DateFilter from '@/components/DateFilter';
import { Loader2, RefreshCw, Save, Trash2, Eraser } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PhaseProgressDashboard } from '@/components/PhaseProgressDashboard';
import { AiAssistButton } from '@/components/AiAssistButton';
import { useMyPredictions } from '@/shared/hooks/useMyPredictions';
import { DynamicPredictionsWrapper } from '@/components/DynamicPredictionsWrapper';
import { useFilteredMatches } from '@/hooks/useFilteredMatches';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BracketView } from '@/components/BracketView';
import { Calendar, Activity } from 'lucide-react';
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
    const [leagueMetadata, setLeagueMetadata] = useState<any>(null);
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

    const fetchLeagueMetadata = async () => {
        try {
            console.log('🔍 Fetching league metadata for leagueId:', leagueId);
            const { data } = await api.get(`/leagues/${leagueId}/metadata`);
            console.log('✅ League metadata received:', data);
            setLeagueMetadata(data.league);
        } catch (error: any) {
            console.error('❌ Error fetching league metadata:', error);
            console.error('Error response:', error.response?.data);
            // Set default to WC2026 if fetch fails
            setLeagueMetadata({ tournamentId: 'WC2026' });
        }
    };

    useEffect(() => {
        if (leagueId) {
            fetchMatches();
            fetchLeagueMetadata();
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
                homeTeam: m.homeTeam || m.home_team,
                awayTeam: m.awayTeam || m.away_team,
                homeFlag: ensureFlagUrl(m.homeFlag, m.homeTeam || m.home_team || m.homeTeamPlaceholder),
                awayFlag: ensureFlagUrl(m.awayFlag, m.awayTeam || m.away_team || m.awayTeamPlaceholder),
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

    // Filter matches by unlocked phases
    const { filteredMatches: phaseFilteredMatches } = useFilteredMatches(matches, leagueMetadata?.tournamentId);
    
    // Use filtered matches for all operations
    const finalMatches = phaseFilteredMatches;

    // Update dates logic
    useEffect(() => {
        if (finalMatches.length > 0) {
            const uniqueDates = Array.from(new Set(finalMatches.map((m: any) => m.displayDate))) as string[];
            setDates(uniqueDates);
            // If no selection or current selection invalid
            if (!selectedDate || !uniqueDates.includes(selectedDate)) {
                setSelectedDate(uniqueDates[0]);
            }
        }
    }, [finalMatches]); // Removed selectedDate from dependencies to avoid infinite loop

    // Filter matches by selected date
    const matchesByDate = useMemo(() =>
        finalMatches.filter(m => m.displayDate === selectedDate),
        [finalMatches, selectedDate]
    );

    const currentPhase = useMemo(() => {
        if (finalMatches.length === 0) return 'GROUP';
        const phases = matchesByDate.map((m: any) => m.phase).filter(Boolean);
        // Simple logic: return the phase of the first match in the view, or GROUP
        return phases[0] || 'GROUP';
    }, [finalMatches, matchesByDate]);

    const handlePhaseClick = (phase: string) => {
        const phaseMatches = finalMatches.filter(m => m.phase === phase);
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

        const match = finalMatches.find(m => m.id === matchId);
        await savePrediction(matchId, parseInt(homeScore), parseInt(awayScore), isJoker, match?.phase);
    };

    const handleAiPredictions = (newPredictions: { [matchId: string]: [number, number] }) => {
        const suggestionsMap: Record<string, { h: number, a: number }> = {};
        
        console.log("🤖 Recibiendo predicciones IA (Enterprise):", Object.keys(newPredictions).length);

        Object.entries(newPredictions).forEach(([mId, scores]) => {
            const cleanId = mId.trim();
            const [h, a] = scores;

            if (cleanId) {
                suggestionsMap[cleanId] = { h, a };
            }
        });
        
        if (Object.keys(suggestionsMap).length === 0) {
            toast.error('La IA no devolvió predicciones válidas');
            return;
        }

        // Use startTransition to prevent React rendering errors
        React.startTransition(() => {
            setAiSuggestions(prev => ({ ...prev, ...suggestionsMap }));
        });
        
        toast.info(`¡${Object.keys(suggestionsMap).length} sugerencias aplicadas! (Borrador)`);
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

    // Only use wrapper for Champions League (UCL has different phase unlock logic)
    const isChampionsLeague = leagueMetadata?.tournamentId === 'UCL2526';
    
    const mainContent = (
        <div className="min-h-screen bg-transparent pb-24 md:pb-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <Tabs defaultValue="matches" className="w-full">
                    <div className="w-full max-w-lg mx-auto px-4 pt-4 mb-6">
                         <TabsList className="grid w-full grid-cols-2 mb-4 bg-[#1E293B] p-1 h-auto rounded-xl border border-[#334155]">
                            <TabsTrigger 
                                value="matches"
                                className="data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                            >
                                <Calendar size={16} />
                                Partidos
                            </TabsTrigger>
                            <TabsTrigger 
                                value="bracket"
                                className="data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                            >
                                <Activity size={16} />
                                Llaves
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="matches" className="mt-0">
                            <PhaseProgressDashboard onPhaseClick={handlePhaseClick} tournamentId={leagueMetadata?.tournamentId} />

                            <div className="mt-4 flex flex-col gap-3">
                                <AiAssistButton
                                    matches={matches}
                                    onPredictionsGenerated={handleAiPredictions}
                                />

                                <div className="flex gap-3">
                                    <Button
                                        onClick={handleSaveAiPredictions}
                                        disabled={Object.keys(aiSuggestions).length === 0}
                                        className={`flex-1 gap-2 font-bold shadow-md transition-all ${Object.keys(aiSuggestions).length > 0
                                                ? 'bg-green-600 hover:bg-green-500 text-white hover:scale-[1.02] shadow-green-900/20'
                                                : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                                            }`}
                                    >
                                        <Save className="w-4 h-4" />
                                        GUARDAR
                                    </Button>

                                    {Object.keys(aiSuggestions).length > 0 ? (
                                        <Button
                                            onClick={handleClearPredictions}
                                            className="flex-1 gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 font-bold hover:scale-[1.02] transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                            DESCARTAR
                                        </Button>
                                    ) : (
                                        <Button
                                            onClick={async () => {
                                                if (confirm('¿Estás seguro de que deseas borrar TODAS tus predicciones en esta liga? Esta acción no se puede deshacer.')) {
                                                    await clearAllPredictions();
                                                    if (dates.length > 0) {
                                                        setSelectedDate(dates[0]);
                                                    }
                                                }
                                            }}
                                            className="flex-1 gap-2 bg-slate-800 hover:bg-red-900/20 text-slate-400 hover:text-red-400 border border-slate-700 font-bold transition-all"
                                        >
                                            <Eraser className="w-4 h-4" />
                                            LIMPIAR
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </TabsContent>
                    </div>

                    <TabsContent value="matches" className="w-full max-w-lg mx-auto px-4 mt-0">
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

                        <div className="flex flex-col gap-4 pb-4">
                            {matchesByDate.length > 0 ? (
                                matchesByDate.map((match: any) => (
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
                    </TabsContent>

                    <TabsContent value="bracket" className="max-w-md mx-auto px-4 mt-0">
                         <BracketView
                            matches={matches.map((m: any) => ({
                                ...m,
                                homeTeam: typeof m.homeTeam === 'object' ? (m.homeTeam as any).code : m.homeTeam,
                                awayTeam: typeof m.awayTeam === 'object' ? (m.awayTeam as any).code : m.awayTeam,
                                homeFlag: typeof m.homeTeam === 'object' ? (m.homeTeam as any).flag : m.homeFlag,
                                awayFlag: typeof m.awayTeam === 'object' ? (m.awayTeam as any).flag : m.awayFlag,
                                homeTeamPlaceholder: m.homeTeamPlaceholder,
                                awayTeamPlaceholder: m.awayTeamPlaceholder,
                            }))}
                            leagueId={leagueId}
                        />
                    </TabsContent>
                </Tabs>
            </div>
    );

    // Only wrap with DynamicPredictionsWrapper for Champions League
    if (isChampionsLeague) {
        return (
            <DynamicPredictionsWrapper currentPhase={currentPhase} tournamentId={leagueMetadata?.tournamentId}>
                {mainContent}
            </DynamicPredictionsWrapper>
        );
    }

    // For World Cup, return without wrapper (phase filtering handles it)
    return mainContent;
};
