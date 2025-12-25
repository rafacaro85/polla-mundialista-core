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

interface AiSuggestionsButtonProps {
    matches: Match[];
    onPredictionsGenerated: (predictions: { [matchId: string]: [number, number] }) => void;
}

export function AiSuggestionsButton({ matches, onPredictionsGenerated }: AiSuggestionsButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            // Preparar los datos para la IA solo con lo necesario
            const matchesForAi = matches.map(m => ({
                id: m.id,
                homeTeam: typeof m.homeTeam === 'object' ? m.homeTeam.code || 'Unknown' : m.homeTeam,
                awayTeam: typeof m.awayTeam === 'object' ? m.awayTeam.code || 'Unknown' : m.awayTeam,
                date: m.date
            }));

            const predictions = await generateAiPredictions(matchesForAi);

            if (predictions) {
                onPredictionsGenerated(predictions);
                toast.success('¡La IA ha completado tu polla! Revisa y guarda.');
            } else {
                toast.error('No se pudieron generar predicciones.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al contactar con la IA.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed group border border-purple-400/30"
        >
            {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <Sparkles className="w-4 h-4 text-yellow-200 group-hover:scale-110 transition-transform" />
            )}
            <span>{loading ? 'Consultando IA...' : 'Sugerir Resultados con IA'}</span>
        </button>
    );
}
