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


interface SocialFixtureProps {
    matchesData: any[]; // Raw SWR data from DashboardClient
    loading: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    leagueId?: string;
}

import { getTeamFlagUrl } from '@/shared/utils/flags';

// Helper to ensure flag is a URL
// Helper to ensure flag is a URL
const ensureFlagUrl = (flag: string | null | undefined, teamName: string) => {
    // If it's a full URL (starts with http) or local path (starts with /), trust it.
    if (flag && (flag.startsWith('http') || flag.startsWith('/'))) return flag;
    
    // If it's a short code (ISO like 'br', 'es'), assume flagcdn
    if (flag && flag.length <= 3 && !flag.includes('/')) return `https://flagcdn.com/h80/${flag}.png`;
    
    // Fallback
    return getTeamFlagUrl(teamName);
};

export const SocialFixture: React.FC<SocialFixtureProps> = ({ matchesData, loading, onRefresh, isRefreshing, leagueId }) => {
    const { predictions, savePrediction, saveBulkPredictions, deletePrediction, clearAllPredictions, refresh: refreshPredictions } = useMyPredictions(leagueId === 'global' ? undefined : leagueId);
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, { h: number, a: number }>>({});
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Merge Logic
    const matches = useMemo(() => {
        if (!matchesData) return [];
        // Filtro eliminado para permitir ver fases siguientes cuando se desbloquean desde el backend
        return matchesData
            // .filter((m: any) => new Date(m.date) <= new Date('2026-06-28T12:00:00Z'))
            .map((m: any) => {
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
    }, [matchesData, predictions, aiSuggestions]);

    // Filter matches by unlocked phases (Mundial only)
    const { filteredMatches: phaseFilteredMatches } = useFilteredMatches(matches, 'WC2026');
    
    // Use filtered matches for all operations
    const finalMatches = phaseFilteredMatches;

    // Dates Logic
    useEffect(() => {
        if (finalMatches.length > 0) {
            const uniqueDates = Array.from(new Set(finalMatches.map((m: any) => m.displayDate))) as string[];
            setDates(uniqueDates);
            // Si no hay selección o la selección actual ya no es válida (ej: fecha desapareció)
            if (!selectedDate || !uniqueDates.includes(selectedDate)) {
                setSelectedDate(uniqueDates[0]);
            }
        }
    }, [finalMatches]); // Removed selectedDate from dependencies to avoid infinite loop

    const matchesByDate = useMemo(() =>
        finalMatches.filter(m => m.displayDate === selectedDate),
        [finalMatches, selectedDate]
    );

    const handlePhaseClick = (phase: string) => {
        // Find the first match of this phase
        const phaseMatches = finalMatches.filter(m => m.phase === phase);
        if (phaseMatches.length > 0) {
            // Sort by actual date to pick the earliest
            const firstMatch = phaseMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];
            setSelectedDate(firstMatch.displayDate);
            toast.info(`Navegando a ${phase}`);
        } else {
            toast.error('No hay partidos para esta fase');
        }
    };

    const handlePredictionChange = async (matchId: string, homeScore: any, awayScore: any, isJoker?: boolean) => {
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
        Object.entries(newPredictions).forEach(([mId, [h, a]]) => {
            const existing = predictions[mId];
            // Sugerir si NO tiene predicción O si la que tiene es GLOBAL (queremos una específica para esta liga)
            if (!existing || existing.leagueId === null) {
                suggestionsMap[mId] = { h, a };
            }
        });
        
        // Use startTransition to prevent React rendering errors
        React.startTransition(() => {
            setAiSuggestions(prev => ({ ...prev, ...suggestionsMap }));
        });
        
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

    // Detect current phase from filtered matches
    const currentPhase = useMemo(() => {
        if (finalMatches.length === 0) return 'GROUP';
        const phases = matchesByDate.map((m: any) => m.phase).filter(Boolean);
        return phases[0] || 'GROUP';
    }, [finalMatches, matchesByDate]);

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Phase Progress */}
            {/* Phase Progress */}
            <div className="mb-6">
                <PhaseProgressDashboard onPhaseClick={handlePhaseClick} />

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
            </div>

            <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex-1 overflow-x-auto">
                    <DateFilter
                        dates={dates}
                        selectedDate={selectedDate}
                        onSelect={setSelectedDate}
                    />
                </div>
                <Button
                    onClick={onRefresh}
                    variant="outline"
                    size="icon"
                    className="shrink-0 bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-400 hover:text-white"
                    title="Actualizar Marcadores"
                >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[var(--brand-primary,#00E676)]' : ''}`} />
                </Button>
            </div>

            <div className="flex flex-col gap-4 pb-4">
                {loading ? (
                    <div className="text-center py-20 text-slate-400 animate-pulse">Cargando partidos...</div>
                ) : matchesByDate.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No hay partidos para esta fecha</div>
                ) : (
                    matchesByDate.map((match: any) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            showInputs={true}
                            onSavePrediction={handlePredictionChange}
                        // onInfoClick={() => setInfoMatch(match)} // We can expose this prop if needed.
                        />
                    ))
                )}
            </div>
        </div >
    );
};
