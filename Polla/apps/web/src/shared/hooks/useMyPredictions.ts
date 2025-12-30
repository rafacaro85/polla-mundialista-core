import useSWR, { mutate } from 'swr';
import React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

const PREDICTIONS_ENDPOINT = '/predictions/me';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export const useMyPredictions = () => {
    const { data, error, isLoading } = useSWR(PREDICTIONS_ENDPOINT, fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 2000
    });

    const predictionsMap = React.useMemo(() => {
        const map: Record<string, any> = {};
        if (Array.isArray(data)) {
            data.forEach((p: any) => {
                const mId = p.matchId || p.match?.id;
                if (mId) {
                    map[mId] = {
                        matchId: mId,
                        homeScore: p.homeScore,
                        awayScore: p.awayScore,
                        points: p.points,
                        isJoker: p.isJoker,
                        scoreH: p.homeScore, // Legacy map sometimes needed
                        scoreA: p.awayScore
                    };
                }
            });
        }
        return map;
    }, [data]);

    const savePrediction = async (matchId: string, homeScore: number, awayScore: number, isJoker: boolean = false, phase?: string) => {
        // Optimistic object
        const optimisticPrediction = {
            matchId,
            match: { id: matchId, phase },
            homeScore,
            awayScore,
            isJoker,
            points: 0 // Optimistic default
        };

        // Mutate local cache immediately
        mutate(PREDICTIONS_ENDPOINT, (currentData: any) => {
            let list = Array.isArray(currentData) ? [...currentData] : [];

            // If setting joker, optimistically unset others in same phase
            if (isJoker) {
                list = list.map((p: any) => {
                    const pMatchId = p.matchId || p.match?.id;
                    if (pMatchId !== matchId) {
                        // If we have phase info, only unset same phase. 
                        // If no phase provided, we might unset all (safer for optimistic UI)
                        if (!phase || p.match?.phase === phase) {
                            return { ...p, isJoker: false };
                        }
                    }
                    return p;
                });
            }

            const index = list.findIndex((p: any) => (p.matchId === matchId || p.match?.id === matchId));

            if (index >= 0) {
                list[index] = { ...list[index], ...optimisticPrediction };
            } else {
                list.push(optimisticPrediction);
            }
            return list;
        }, false);

        try {
            await api.post('/predictions', { matchId, homeScore, awayScore, isJoker });
            mutate(PREDICTIONS_ENDPOINT); // Revalidate real data
            toast.success('Predicción guardada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error guardando predicción');
            mutate(PREDICTIONS_ENDPOINT); // Rollback
        }
    };

    return {
        predictions: predictionsMap,
        loading: isLoading,
        error,
        savePrediction,
        refresh: () => mutate(PREDICTIONS_ENDPOINT)
    };
};
