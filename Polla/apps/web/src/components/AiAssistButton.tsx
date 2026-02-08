'use client';

import React, { useState } from 'react';
import { generateAiPredictions } from '@/actions/ai-predictions';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Match {
    id: string;
    homeTeam: string | { code: string; flag: string } | any;
    awayTeam: string | { code: string; flag: string } | any;
    date: string;
    [key: string]: any;
}

interface AiAssistButtonProps {
    matches: Match[];
    onPredictionsGenerated: (predictions: { [matchId: string]: [number, number] }) => void;
}

export function AiAssistButton({ matches, onPredictionsGenerated }: AiAssistButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Filter matches to only include those with defined teams (not TBD)
            // This ensures we only predict the current playable phase
            const playableMatches = matches.filter(m => {
                const home = (typeof m.homeTeam === 'object' ? m.homeTeam.code : m.homeTeam) || m.homeTeamPlaceholder || 'TBD';
                const away = (typeof m.awayTeam === 'object' ? m.awayTeam.code : m.awayTeam) || m.awayTeamPlaceholder || 'TBD';
                
                // Only include matches where both teams are defined (not TBD, not empty)
                return home !== 'TBD' && home !== '' && away !== 'TBD' && away !== '';
            });

            if (playableMatches.length === 0) {
                toast.error('No hay partidos disponibles para predecir en esta fase.');
                setLoading(false);
                return;
            }

            // Preparar los datos para la IA solo con lo necesario
            const matchesForAi = playableMatches.map(m => {
                const home = (typeof m.homeTeam === 'object' ? m.homeTeam.code : m.homeTeam) || m.homeTeamPlaceholder || 'TBD';
                const away = (typeof m.awayTeam === 'object' ? m.awayTeam.code : m.awayTeam) || m.awayTeamPlaceholder || 'TBD';
                
                return {
                    id: m.id,
                    homeTeam: home,
                    awayTeam: away,
                    date: m.date
                };
            });

            const response = await generateAiPredictions(matchesForAi);

            if (response.success && response.data) {
                onPredictionsGenerated(response.data);
                toast.success(`¡La IA ha completado ${playableMatches.length} predicciones! Revisa y guarda.`);
            } else {
                console.error('AI Error:', response.error);
                toast.error(`Error: ${response.error || 'No se pudieron generar predicciones'}`);
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Error al contactar con la IA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-purple-400/30"
        >
            {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Sparkles className="w-5 h-5 text-yellow-200 group-hover:scale-110 transition-transform" />
            )}
            <span>{loading ? 'Consultando IA...' : 'Sugerir Resultados con IA'}</span>
        </button>
    );
}
