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


interface SocialFixtureProps {
    matchesData: any[]; // Raw SWR data from DashboardClient
    loading: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    leagueId?: string;
    tournamentId?: string; // From the league entity - overrides URL detection
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

export const SocialFixture: React.FC<SocialFixtureProps> = ({ matchesData, loading, onRefresh, isRefreshing, leagueId, tournamentId: propTournamentId }) => {
    const { tournamentId: detectedTournamentId } = useTournament();
    // Always use prop from league entity if provided; fall back to URL-detected
    const tournamentId = propTournamentId || detectedTournamentId;
    const { predictions, savePrediction, saveBulkPredictions, deletePrediction, clearAllPredictions, refresh: refreshPredictions } = useMyPredictions(leagueId === 'global' ? undefined : leagueId);
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, { h: number, a: number }>>({});
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Simplified mapping logic to ensure reactivity
    const matches = matchesData ? matchesData.map((m: any) => {
        const date = new Date(m.date);
        const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
            'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
        const month = monthNames[date.getMonth()];
        const day = date.getDate();
        const dateStr = `${month} ${day}`;
        const displayDate = dateStr;

        const cleanId = (m.id || '').trim();
        const pred = predictions[cleanId] || predictions[m.id];
        // Buscar sugerencia con limpieza de ID
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
    }) : [];

    // Filter matches by unlocked phases
    const { filteredMatches: phaseFilteredMatches } = useFilteredMatches(matches, tournamentId);
    
    // Use filtered matches for all operations
    const finalMatches = phaseFilteredMatches;

    // Dates Logic - Improved stability
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
    };

    const handleAiPredictions = (newPredictions: { [matchId: string]: [number, number] }) => {
        const suggestionsMap: Record<string, { h: number, a: number }> = {};
        
        console.log("🤖 Recibiendo predicciones IA:", Object.keys(newPredictions).length);
        
        Object.entries(newPredictions).forEach(([mId, scores]) => {
            // Limpieza básica de ID por si la IA añade espacios o comillas extra
            const cleanId = mId.trim();
            const [h, a] = scores;

            // Sugerir siempre que el mId sea válido. 
            // La UI ya se encarga de dar prioridad a la sugerencia sobre lo guardado.
            if (cleanId) {
                suggestionsMap[cleanId] = { h, a };
            }
        });
        
        if (Object.keys(suggestionsMap).length === 0) {
            toast.error('La IA no devolvió predicciones válidas para estos partidos');
            return;
        }

        // Actualizar estado de forma inmediata
        setAiSuggestions(prev => ({ ...prev, ...suggestionsMap }));
        
        console.log("✅ Sugerencias integradas en el estado.");
        
        toast.info(`¡${Object.keys(suggestionsMap).length} sugerencias aplicadas! (Borrador)`);
    };

    const handleClearPredictions = () => {
        setAiSuggestions({});
        toast.info('Sugerencias limpiadas');
    };

    const handleSaveAiPredictions = async () => {
        // Filter out any matches that might have become locked in the meantime
        const now = new Date();
        const validSuggestions: Record<string, { h: number, a: number }> = {};
        let lockedCount = 0;

        Object.entries(aiSuggestions).forEach(([mId, scores]) => {
            const match = finalMatches.find(m => m.id === mId);
            if (!match) return;

            // Check Status
            const isFinished = match.status === 'FINISHED' || match.status === 'COMPLETED';
            
            // Check Time Lock (10 mins buffer)
            const matchDate = new Date(match.date);
            const lockTime = new Date(matchDate.getTime() - (10 * 60 * 1000));
            const isTimeLocked = now >= lockTime;

            if (isFinished || isTimeLocked) {
                lockedCount++;
                return;
            }

            validSuggestions[mId] = scores;
        });

        if (Object.keys(validSuggestions).length === 0) {
            toast.error('No hay predicciones válidas para guardar (Todos los partidos están finalizados o bloqueados)');
            setAiSuggestions({}); // Clear stale suggestions
            return;
        }

        if (lockedCount > 0) {
            toast.warning(`${lockedCount} predicciones descartadas por bloqueo (partido iniciado o finalizado).`);
        }

        await saveBulkPredictions(validSuggestions);
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pb-4">
                {loading ? (
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
                        // onInfoClick={() => setInfoMatch(match)} // We can expose this prop if needed.
                        />
                    ))
                )}
            </div>
        </div >
    );
};
