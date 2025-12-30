'use client';

import React, { useEffect, useState, useMemo } from 'react';
import MatchCard from '@/components/MatchCard';
import DateFilter from '@/components/DateFilter';
import { Loader2, RefreshCw } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { PhaseProgressDashboard } from '@/components/PhaseProgressDashboard';
import { AiSuggestionsButton } from '@/components/AiSuggestionsButton';
import { useMyPredictions } from '@/shared/hooks/useMyPredictions';

interface SocialFixtureProps {
    matchesData: any[]; // Raw SWR data from DashboardClient
    loading: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
}

import { getTeamFlagUrl } from '@/shared/utils/flags';

export const SocialFixture: React.FC<SocialFixtureProps> = ({ matchesData, loading, onRefresh, isRefreshing }) => {
    const { predictions, savePrediction, refresh: refreshPredictions } = useMyPredictions();
    const [aiSuggestions, setAiSuggestions] = useState<Record<string, { h: number, a: number }>>({});
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');

    // Merge Logic
    const matches = useMemo(() => {
        if (!matchesData) return [];
        return matchesData.map((m: any) => {
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
                homeFlag: m.homeFlag || getTeamFlagUrl(m.homeTeam || m.homeTeamPlaceholder),
                awayFlag: m.awayFlag || getTeamFlagUrl(m.awayTeam || m.awayTeamPlaceholder),
                status: m.status === 'COMPLETED' ? 'FINISHED' : m.status,
                scoreH: m.homeScore,
                scoreA: m.awayScore,
                prediction: pred ? {
                    homeScore: pred.homeScore,
                    awayScore: pred.awayScore,
                    points: pred.points || 0
                } : undefined,
                userH,
                userA,
                points: pred?.points || 0
            };
        });
    }, [matchesData, predictions, aiSuggestions]);

    // Dates Logic
    useEffect(() => {
        if (matches.length > 0) {
            const uniqueDates = Array.from(new Set(matches.map((m: any) => m.displayDate))) as string[];
            setDates(uniqueDates);
            // Only set selected date if not set, or if previously selected date no longer exists? 
            // Better to keep existing if valid.
            if (!selectedDate && uniqueDates.length > 0) {
                setSelectedDate(uniqueDates[0]);
            }
        }
    }, [matches, selectedDate]);

    const filteredMatches = useMemo(() =>
        matches.filter(m => m.displayDate === selectedDate),
        [matches, selectedDate]
    );

    const handlePhaseClick = (phase: string) => {
        // Find the first match of this phase
        const phaseMatches = matches.filter(m => m.phase === phase);
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
            try {
                await api.delete(`/predictions/${matchId}`);
                toast.success('Predicción eliminada');
                refreshPredictions();
            } catch (e) { toast.error('Error al eliminar'); }
            return;
        }

        await savePrediction(matchId, parseInt(homeScore), parseInt(awayScore), isJoker);
    };

    const handleAiPredictions = (newPredictions: { [matchId: string]: [number, number] }) => {
        const suggestionsMap: Record<string, { h: number, a: number }> = {};
        Object.entries(newPredictions).forEach(([mId, [h, a]]) => {
            if (!predictions[mId]) {
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
        const promises = Object.entries(aiSuggestions).map(([mId, { h, a }]) => {
            return savePrediction(mId, h, a);
        });
        await Promise.all(promises);
        setAiSuggestions({});
        toast.success(`${promises.length} predicciones guardadas`);
    };

    return (
        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Phase Progress */}
            <div className="mb-6">
                <PhaseProgressDashboard onPhaseClick={handlePhaseClick} />
                <div className="mt-4 flex justify-center">
                    <AiSuggestionsButton
                        matches={matches}
                        onPredictionsGenerated={handleAiPredictions}
                        onClear={handleClearPredictions}
                        onSave={handleSaveAiPredictions}
                    />
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
                ) : filteredMatches.length === 0 ? (
                    <div className="text-center py-10 text-slate-500">No hay partidos para esta fecha</div>
                ) : (
                    filteredMatches.map((match) => (
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
        </div>
    );
};
