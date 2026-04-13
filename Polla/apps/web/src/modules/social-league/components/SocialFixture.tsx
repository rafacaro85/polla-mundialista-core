'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
import { useTournament } from '@/hooks/useTournament';
import { getTeamFlagUrl } from '@/shared/utils/flags';
import { trackPrediction } from '@/lib/metaPixel';

// Helper to ensure flag is a URL
const ensureFlagUrl = (flag: string | null | undefined, teamName: string) => {
    if (flag && (flag.startsWith('http') || flag.startsWith('/'))) return flag;
    if (flag && flag.length <= 3 && !flag.includes('/')) return `https://flagcdn.com/h80/${flag}.png`;
    return getTeamFlagUrl(teamName);
};

interface SocialFixtureProps {
    // leagueId is required to fetch matches from the correct league endpoint
    leagueId?: string;
    // tournamentId from league entity — used for phase filtering
    tournamentId?: string;
    // Legacy props kept for backwards compat but no longer used for data fetching
    matchesData?: any[];
    loading?: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

export const SocialFixture: React.FC<SocialFixtureProps> = ({
    leagueId,
    tournamentId: propTournamentId,
    // Legacy props (ignored - SocialFixture now self-fetches)
    onRefresh: externalOnRefresh,
    isRefreshing: externalIsRefreshing,
}) => {
    const { tournamentId: detectedTournamentId } = useTournament();
    // Prefer prop from league entity over URL-detected (fallback only)
    const tournamentId = propTournamentId || detectedTournamentId;

    const { predictions, savePrediction, saveBulkPredictions, deletePrediction, clearAllPredictions, refresh: refreshPredictions } = useMyPredictions(
        leagueId === 'global' ? undefined : leagueId,
        propTournamentId
    );
    const [rawMatches, setRawMatches] = useState<any[]>([]);
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, { h: number, a: number }>>({});
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [loadingMatches, setLoadingMatches] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [jokerStatusList, setJokerStatusList] = useState<any[]>([]);

    // ┌─────────────────────────────────────────────────────────────┐
    // │  KEY FIX: Self-fetch from /leagues/:id/matches              │
    // │  This mirrors EnterpriseFixture and eliminates the race     │
    // │  condition where tournamentId was undefined at first render  │
    // │  causing a fallback to WC2026 on the global endpoint.       │
    // └─────────────────────────────────────────────────────────────┘
    const fetchMatches = async () => {
        if (!leagueId || leagueId === 'global') {
            setLoadingMatches(false);
            return;
        }
        try {
            // /leagues/:id/matches → backend reads league.tournamentId directly
            // No need to pass tournamentId — the backend extracts it from the league record
            const { data } = await api.get(`/leagues/${leagueId}/matches`);
            setRawMatches(data || []);
        } catch (error) {
            console.error('Error fetching matches for league:', leagueId, error);
            toast.error('Error al cargar los partidos');
        } finally {
            setLoadingMatches(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([fetchMatches(), refreshPredictions()]);
        setIsRefreshing(false);
        toast.success('Marcadores actualizados');
        // Also call external refresh if provided (for legacy compat)
        if (externalOnRefresh) externalOnRefresh();
    };

    useEffect(() => {
        fetchMatches();

        // 🔄 Polling automático cada 30 segundos
        const timer = setInterval(() => {
            fetchMatches();
        }, 30000);

        return () => clearInterval(timer);
    }, [leagueId]);

    const fetchJokerStatus = async () => {
        if (!tournamentId) return;
        try {
            const { data } = await api.get(`/predictions/joker-status?tournamentId=${tournamentId}${leagueId && leagueId !== 'global' ? `&leagueId=${leagueId}` : ''}`);
            setJokerStatusList(data || []);
        } catch (e) {
            console.error('Error fetching joker status', e);
        }
    };

    // Refetch jokers when predictions change (like after a save)
    useEffect(() => {
        fetchJokerStatus();
    }, [tournamentId, leagueId, predictions]);

    // Merge predictions + ai suggestions into matches
    const matches = useMemo(() => {
        if (!rawMatches.length) return [];
        return rawMatches.map((m: any) => {
            const date = new Date(m.date);
            const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
            const month = monthNames[date.getMonth()];
            const day = date.getDate();
            const dateStr = `${month} ${day}`;

            const cleanId = (m.id || '').trim();
            const pred = predictions[cleanId] || predictions[m.id];
            const suggestion = aiSuggestions[cleanId];

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
                displayDate: dateStr,
                homeTeam: m.homeTeam || m.home_team,
                awayTeam: m.awayTeam || m.away_team,
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

    // Filter matches by unlocked phases using the correct tournamentId
    const { filteredMatches: phaseFilteredMatches } = useFilteredMatches(matches, tournamentId);

    // For UCL: hide PLAYOFF_1 (ida - already played Feb 17-18), show only PLAYOFF_2 (vuelta) and beyond
    const finalMatches = useMemo(() => {
        const isUCL = (tournamentId || '').toUpperCase().includes('UCL');
        if (!isUCL) return phaseFilteredMatches;
        return phaseFilteredMatches.filter((m: any) => m.phase !== 'PLAYOFF_1' && m.phase !== 'PLAYOFF_2');
    }, [phaseFilteredMatches, tournamentId]);

    // Dates Logic
    useEffect(() => {
        if (finalMatches.length > 0) {
            const uniqueDates = Array.from(new Set(finalMatches.map((m: any) => m.displayDate))) as string[];
            setDates(prev => {
                const isSame = prev.length === uniqueDates.length && prev.every((d, i) => d === uniqueDates[i]);
                return isSame ? prev : uniqueDates;
            });
            if (!selectedDate || !uniqueDates.includes(selectedDate)) {
                setSelectedDate(uniqueDates[0]);
            }
        }
    }, [finalMatches.length, finalMatches[0]?.id]);

    const matchesByDate = useMemo(() =>
        finalMatches.filter(m => m.displayDate === selectedDate),
        [finalMatches, selectedDate]
    );

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
        const cleanId = matchId.trim();
        if (aiSuggestions[cleanId]) {
            const next = { ...aiSuggestions };
            delete next[cleanId];
            setAiSuggestions(next);
        }
        if ((homeScore === null || homeScore === '') && (awayScore === null || awayScore === '')) {
            await deletePrediction(matchId);
            return;
        }
        const match = finalMatches.find(m => m.id === matchId);
        await savePrediction(matchId, parseInt(homeScore), parseInt(awayScore), isJoker, match?.phase);
        trackPrediction(); // Disparar pixel de Meto
    };

    const handleAiPredictions = (newPredictions: { [matchId: string]: [number, number] }) => {
        const suggestionsMap: Record<string, { h: number, a: number }> = {};
        console.log("🤖 Recibiendo predicciones IA:", Object.keys(newPredictions).length);
        Object.entries(newPredictions).forEach(([mId, scores]) => {
            const cleanId = mId.trim();
            const [h, a] = scores;
            if (cleanId) suggestionsMap[cleanId] = { h, a };
        });
        if (Object.keys(suggestionsMap).length === 0) {
            toast.error('La IA no devolvió predicciones válidas para estos partidos');
            return;
        }
        setAiSuggestions(prev => ({ ...prev, ...suggestionsMap }));
        toast.info(`¡${Object.keys(suggestionsMap).length} sugerencias aplicadas! (Borrador)`);
    };

    const handleClearPredictions = () => {
        setAiSuggestions({});
        toast.info('Sugerencias limpiadas');
    };

    const handleSaveAiPredictions = async () => {
        const now = new Date();
        const validSuggestions: Record<string, { h: number, a: number }> = {};
        let lockedCount = 0;
        Object.entries(aiSuggestions).forEach(([mId, scores]) => {
            const match = finalMatches.find(m => m.id === mId);
            if (!match) return;
            const isFinished = match.status === 'FINISHED' || match.status === 'COMPLETED';
            const matchDate = new Date(match.date);
            const lockTime = new Date(matchDate.getTime() - (10 * 60 * 1000));
            const isTimeLocked = now >= lockTime;
            if (isFinished || isTimeLocked) { lockedCount++; return; }
            validSuggestions[mId] = scores;
        });
        if (Object.keys(validSuggestions).length === 0) {
            toast.error('No hay predicciones válidas para guardar (Todos los partidos están finalizados o bloqueados)');
            setAiSuggestions({});
            return;
        }
        if (lockedCount > 0) toast.warning(`${lockedCount} predicciones descartadas por bloqueo.`);
        await saveBulkPredictions(validSuggestions);
        setAiSuggestions({});
        trackPrediction(); // Disparar pixel de Meto
    };

    const currentPhase = useMemo(() => {
        if (finalMatches.length === 0) return 'GROUP';
        const phases = matchesByDate.map((m: any) => m.phase).filter(Boolean);
        return phases[0] || 'GROUP';
    }, [matchesByDate]);

    const currentGroup = useMemo(() => {
        const groups = matchesByDate.map((m: any) => m.group).filter(Boolean);
        return groups[0] || null;
    }, [matchesByDate]);

    const currentPhaseJokerStatus = useMemo(() => {
        if (!jokerStatusList.length) return null;
        const isWCGroup = tournamentId === 'WC2026' && currentPhase.startsWith('GROUP');
        const phaseToFind = isWCGroup ? 'GROUP' : currentPhase;
        
        // 1. Exact match: phase AND group (e.g. QUARTER_FINAL + LEG_2)
        if (currentGroup) {
            const exactMatch = jokerStatusList.find(
                (s: any) => s.phase === phaseToFind && s.group === currentGroup
            );
            if (exactMatch) return exactMatch;
        }

        // 2. Phase-only match (no group filter)
        const phaseMatch = jokerStatusList.find(
            (s: any) => s.phase === phaseToFind && !s.group
        );
        if (phaseMatch) return phaseMatch;

        // 3. Fallback to older behavior (s.phase might be the group name in legacy backend)
        const fallbackMatch = jokerStatusList.find(s => s.phase === currentGroup);
        if (fallbackMatch) return fallbackMatch;

        // 4. ALL fallback
        return jokerStatusList.find((s: any) => s.phase === 'ALL') || null;
    }, [currentPhase, currentGroup, jokerStatusList, tournamentId]);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Phase Progress */}
            <div className="mb-6">
                <PhaseProgressDashboard onPhaseClick={handlePhaseClick} tournamentId={tournamentId} />

                <div className="mt-4 flex flex-col gap-3">
                    <AiAssistButton
                        matches={finalMatches}
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
                                        await clearAllPredictions(tournamentId);
                                        if (dates.length > 0) setSelectedDate(dates[0]);
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
            </div>

            {leagueMetadata?.isMatchMode ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-4 text-center">
                    <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        MODO POLLA MATCH ACTIVO
                    </h3>
                    <p className="text-white text-xs mt-1">El administrador habilitó apuestas en vivo. Solo el partido activo aparece en pantalla.</p>
                </div>
            ) : (
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex-1 overflow-x-auto min-w-[200px]">
                        <DateFilter
                            dates={dates}
                            selectedDate={selectedDate}
                            onSelect={setSelectedDate}
                        />
                    </div>
                    {currentPhaseJokerStatus && (
                        <div className="flex items-center gap-1.5 bg-[#1E293B]/80 rounded border border-white/10 px-3 py-1.5 text-xs sm:text-sm whitespace-nowrap shadow-inner">
                            <span className="text-base sm:text-lg leading-none">🃏</span>
                            <span className="font-medium text-slate-300 tracking-tight">
                                Comodines: <span className={currentPhaseJokerStatus.used >= currentPhaseJokerStatus.max ? 'text-amber-500 font-bold' : 'text-white'}>{currentPhaseJokerStatus.used}</span> / {currentPhaseJokerStatus.max} usados
                            </span>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4 flex items-center justify-between gap-2 flex-wrap">
                <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Actualizar Marcadores"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing || externalIsRefreshing ? 'animate-spin text-[var(--brand-primary,#00E676)]' : ''}`} />
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                {loadingMatches ? (
                    <div className="col-span-full text-center py-20 text-slate-400 animate-pulse">Cargando partidos...</div>
                ) : matchesByDate.length === 0 ? (
                    <div className="col-span-full text-center py-10 text-slate-500">No hay partidos para esta fecha</div>
                ) : (
                    matchesByDate.map((match: any) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            showInputs={true}
                            onSavePrediction={handlePredictionChange}
                        />
                    ))
                )}
            </div>
        </div>
    );
};
