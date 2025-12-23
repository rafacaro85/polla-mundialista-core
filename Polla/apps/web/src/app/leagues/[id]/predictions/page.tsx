'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import MatchCard from '@/components/MatchCard';
import DateFilter from '@/components/DateFilter';
import { Loader2, Gamepad2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';
import { DynamicPredictionsWrapper } from '@/components/DynamicPredictionsWrapper';

interface Match {
    id: string;
    homeTeam: string;
    homeFlag: string;
    awayTeam: string;
    awayFlag: string;
    dateStr: string;
    displayDate: string;
    status: 'SCHEDULED' | 'FINISHED' | 'LIVE' | 'COMPLETED';
    date: string;
    homeScore?: number | null;
    awayScore?: number | null;
    scoreH?: number | null;
    scoreA?: number | null;
    userPrediction?: any;
    prediction?: any;
    userH?: string;
    userA?: string;
    points?: number;
    phase?: string;
    group?: string;
}

const getFlag = (teamName: string) => {
    const flags: { [key: string]: string } = {
        'Colombia': 'https://flagcdn.com/h80/co.png',
        'Argentina': 'https://flagcdn.com/h80/ar.png',
        'Brasil': 'https://flagcdn.com/h80/br.png',
        'Francia': 'https://flagcdn.com/h80/fr.png',
        'España': 'https://flagcdn.com/h80/es.png',
        'Alemania': 'https://flagcdn.com/h80/de.png',
        'USA': 'https://flagcdn.com/h80/us.png',
        'México': 'https://flagcdn.com/h80/mx.png',
        'Inglaterra': 'https://flagcdn.com/h80/gb-eng.png',
        'Italia': 'https://flagcdn.com/h80/it.png',
        'Portugal': 'https://flagcdn.com/h80/pt.png',
        'Uruguay': 'https://flagcdn.com/h80/uy.png',
        'Chile': 'https://flagcdn.com/h80/cl.png',
        'Ecuador': 'https://flagcdn.com/h80/ec.png',
        'Perú': 'https://flagcdn.com/h80/pe.png',
        'Paraguay': 'https://flagcdn.com/h80/py.png',
        'Venezuela': 'https://flagcdn.com/h80/ve.png',
        'Bolivia': 'https://flagcdn.com/h80/bo.png',
        'Canadá': 'https://flagcdn.com/h80/ca.png',
        'Costa Rica': 'https://flagcdn.com/h80/cr.png',
        'Jamaica': 'https://flagcdn.com/h80/jm.png',
        'Panamá': 'https://flagcdn.com/h80/pa.png',
    };
    return flags[teamName] || 'https://flagcdn.com/h80/un.png';
};

export default function GamesPage() {
    const params = useParams();
    const [matches, setMatches] = useState<Match[]>([]);
    const [dates, setDates] = useState<string[]>([]);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                // Fetch matches and predictions
                const [matchesRes, predictionsRes] = await Promise.all([
                    api.get(`/leagues/${params.id}/matches`),
                    api.get(`/predictions/me`)
                ]);

                const matchesData = matchesRes.data;
                const predictionsData = predictionsRes.data || [];

                // Process matches
                const processedMatches = matchesData.map((m: any) => {
                    const date = new Date(m.date);

                    const monthNames = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
                        'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];
                    const month = monthNames[date.getMonth()];
                    const day = date.getDate();
                    const dateStr = `${month} ${day}`;
                    const displayDate = dateStr;

                    const userPrediction = predictionsData.find((p: any) => p.matchId === m.id || p.match?.id === m.id);

                    return {
                        ...m,
                        dateStr,
                        displayDate,
                        homeTeam: { code: m.homeTeam || 'LOC', flag: m.homeFlag || getFlag(m.homeTeam) },
                        awayTeam: { code: m.awayTeam || 'VIS', flag: m.awayFlag || getFlag(m.awayTeam) },
                        status: m.status === 'COMPLETED' ? 'FINISHED' : m.status,
                        scoreH: m.homeScore,
                        scoreA: m.awayScore,
                        prediction: userPrediction ? {
                            homeScore: userPrediction.homeScore,
                            awayScore: userPrediction.awayScore,
                            points: userPrediction.points || 0
                        } : undefined,
                        userH: userPrediction?.homeScore?.toString() || '',
                        userA: userPrediction?.awayScore?.toString() || '',
                        points: userPrediction?.points || 0
                    };
                });

                setMatches(processedMatches);

                // Extract unique dates
                const uniqueDates = Array.from(new Set(processedMatches.map((m: any) => m.displayDate)));
                setDates(uniqueDates as string[]);
                if (uniqueDates.length > 0) setSelectedDate(uniqueDates[0] as string);

            } catch (error) {
                console.error('Error fetching matches:', error);
                toast.error('Error al cargar los partidos');
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchMatches();
        }
    }, [params.id]);

    // Filter matches by selected date
    const filteredMatches = useMemo(() =>
        matches.filter(m => m.displayDate === selectedDate),
        [matches, selectedDate]
    );

    // Detect current phase from matches
    const currentPhase = useMemo(() => {
        if (matches.length === 0) return 'GROUP';

        // Get phases from filtered matches
        const phases = filteredMatches.map(m => m.phase).filter(Boolean);

        // Priority order for phases
        const phaseOrder = ['FINAL', 'SEMI', 'QUARTER', 'ROUND_16', 'ROUND_32', 'GROUP'];

        for (const phase of phaseOrder) {
            if (phases.includes(phase)) {
                return phase;
            }
        }

        return 'GROUP';
    }, [matches, filteredMatches]);

    const handlePredictionChange = async (matchId: string, homeScore: any, awayScore: any, isJoker?: boolean) => {
        try {
            // Delete prediction if both scores are null
            if (homeScore === null && awayScore === null) {
                await api.delete(`/predictions/${matchId}`);

                setMatches(prevMatches =>
                    prevMatches.map(m =>
                        m.id === matchId
                            ? {
                                ...m,
                                prediction: undefined,
                                userH: '',
                                userA: '',
                                points: 0
                            }
                            : m
                    )
                );
                toast.success('Predicción eliminada');
                return;
            }

            // Save prediction
            await api.post(`/predictions`, {
                matchId,
                homeScore: parseInt(homeScore),
                awayScore: parseInt(awayScore),
                isJoker
            });

            setMatches(prevMatches =>
                prevMatches.map(m => {
                    if (m.id === matchId) {
                        return {
                            ...m,
                            prediction: {
                                homeScore: parseInt(homeScore),
                                awayScore: parseInt(awayScore),
                                points: 0
                            },
                            userH: homeScore.toString(),
                            userA: awayScore.toString()
                        };
                    }
                    return m;
                })
            );

            toast.success('Predicción guardada');
        } catch (error: any) {
            console.error('Error saving prediction:', error);
            toast.error(error.response?.data?.message || 'Error al guardar predicción');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={48} />
            </div>
        );
    }

    return (
        <DynamicPredictionsWrapper currentPhase={currentPhase}>
            <div className="min-h-screen bg-brand-bg pb-24 md:pb-4">
                {/* Header */}
                <div className="max-w-4xl mx-auto px-4 pt-8 mb-6 text-center">
                    <div className="flex items-center justify-center gap-3 mb-2">
                        <Gamepad2 className="text-brand-primary" size={32} />
                        <h1 className="text-3xl font-russo uppercase text-brand-text">
                            Juegos
                        </h1>
                    </div>
                    <p className="text-slate-400 text-sm">
                        Haz tus predicciones para cada partido
                    </p>
                </div>

                {/* Date Filter - Horizontal Scroll */}
                {dates.length > 0 && (
                    <div className="mb-6">
                        <DateFilter
                            dates={dates}
                            selectedDate={selectedDate}
                            onSelect={setSelectedDate}
                        />
                    </div>
                )}

                {/* Matches Grid */}
                <div className="max-w-4xl mx-auto px-4 space-y-4">
                    {filteredMatches.length > 0 ? (
                        filteredMatches.map((match: any) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                onSavePrediction={handlePredictionChange}
                            />
                        ))
                    ) : (
                        <div className="bg-brand-secondary border border-brand-primary/20 rounded-2xl p-12 text-center">
                            <p className="text-slate-400">
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
}
