'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import { Loader2, Trophy } from 'lucide-react';
import api from '@/lib/api';

export default function PredictionsPage() {
    const params = useParams();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const { data } = await api.get(`/leagues/${params.id}/matches`);
                setMatches(data);
            } catch (error) {
                console.error('Error fetching matches:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchMatches();
        }
    }, [params.id]);

    const handleSavePrediction = async (matchId: string, homeScore: string, awayScore: string, isJoker: boolean) => {
        try {
            await api.post(`/leagues/${params.id}/predictions`, {
                matchId,
                homeScore: homeScore ? parseInt(homeScore) : null,
                awayScore: awayScore ? parseInt(awayScore) : null,
                isJoker
            });

            // Actualizar el match local
            setMatches(prev => prev.map((m: any) =>
                m.id === matchId
                    ? { ...m, prediction: { homeScore, awayScore, isJoker } }
                    : m
            ));
        } catch (error) {
            console.error('Error saving prediction:', error);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg p-4 pb-24 md:pb-4">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6 text-center">
                <div className="flex items-center justify-center gap-3 mb-2">
                    <Trophy className="text-brand-primary" size={32} />
                    <h1 className="text-3xl font-russo uppercase text-brand-text">
                        Predicciones
                    </h1>
                </div>
                <p className="text-slate-400 text-sm">
                    Haz tus predicciones para cada partido
                </p>
            </div>

            {/* Matches Grid */}
            <div className="max-w-4xl mx-auto space-y-4">
                {matches.length > 0 ? (
                    matches.map((match: any) => (
                        <MatchCard
                            key={match.id}
                            match={match}
                            onSavePrediction={handleSavePrediction}
                        />
                    ))
                ) : (
                    <div className="bg-brand-secondary border border-brand-primary/20 rounded-2xl p-12 text-center">
                        <p className="text-slate-400">No hay partidos disponibles</p>
                    </div>
                )}
            </div>
        </div>
    );
}
