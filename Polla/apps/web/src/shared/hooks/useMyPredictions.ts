import useSWR, { mutate } from 'swr';
import React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

const PREDICTIONS_ENDPOINT = '/predictions/me';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export const useMyPredictions = (leagueId?: string) => {
    const { data, error, isLoading } = useSWR(PREDICTIONS_ENDPOINT, fetcher, {
        revalidateOnFocus: true,
        dedupingInterval: 2000
    });

    const predictionsMap = React.useMemo(() => {
        const map: Record<string, any> = {};
        if (Array.isArray(data)) {
            data.forEach((p: any) => {
                const mId = p.matchId || p.match?.id;
                const pLeagueId = p.leagueId || null;
                const targetLeagueId = leagueId || null;

                // Solo mapear si coincide la liga (o es la predicción global)
                if (mId && pLeagueId === targetLeagueId) {
                    map[mId] = {
                        matchId: mId,
                        homeScore: p.homeScore,
                        awayScore: p.awayScore,
                        points: p.points,
                        isJoker: p.isJoker,
                        scoreH: p.homeScore,
                        scoreA: p.awayScore,
                        leagueId: pLeagueId
                    };
                }
            });
        }
        return map;
    }, [data, leagueId]);

    const savePrediction = async (matchId: string, homeScore: number, awayScore: number, isJoker: boolean = false, phase?: string) => {
        const targetLeagueId = leagueId || null;

        // Optimistic object
        const optimisticPrediction = {
            matchId,
            match: { id: matchId, phase },
            leagueId: targetLeagueId,
            homeScore,
            awayScore,
            isJoker,
            points: 0
        };

        // Mutate local cache immediately
        mutate(PREDICTIONS_ENDPOINT, (currentData: any) => {
            let list = Array.isArray(currentData) ? [...currentData] : [];

            // If setting joker, optimistically unset others in same phase AND league
            if (isJoker) {
                list = list.map((p: any) => {
                    const pMatchId = p.matchId || p.match?.id;
                    const pLeagueId = p.leagueId || null;
                    if (pMatchId !== matchId && pLeagueId === targetLeagueId) {
                        if (!phase || p.match?.phase === phase) {
                            return { ...p, isJoker: false };
                        }
                    }
                    return p;
                });
            }

            const index = list.findIndex((p: any) =>
                (p.matchId === matchId || p.match?.id === matchId) &&
                (p.leagueId || null) === targetLeagueId
            );

            if (index >= 0) {
                list[index] = { ...list[index], ...optimisticPrediction };
            } else {
                list.push(optimisticPrediction);
            }
            return list;
        }, false);

        try {
            await api.post('/predictions', {
                matchId,
                homeScore,
                awayScore,
                isJoker,
                leagueId: targetLeagueId
            });
            mutate(PREDICTIONS_ENDPOINT); // Revalidate real data
            toast.success('Predicción guardada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error guardando predicción');
            mutate(PREDICTIONS_ENDPOINT); // Rollback
        }
    };

    const deletePrediction = async (matchId: string) => {
        const targetLeagueId = leagueId || null;

        // Mutate local cache immediately
        mutate(PREDICTIONS_ENDPOINT, (currentData: any) => {
            const list = Array.isArray(currentData) ? [...currentData] : [];
            return list.filter((p: any) =>
                !((p.matchId === matchId || p.match?.id === matchId) &&
                    (p.leagueId || null) === targetLeagueId)
            );
        }, false);

        try {
            const url = targetLeagueId
                ? `/predictions/${matchId}?leagueId=${targetLeagueId}`
                : `/predictions/${matchId}`;
            await api.delete(url);
            mutate(PREDICTIONS_ENDPOINT);
            toast.success('Predicción eliminada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error eliminando predicción');
            mutate(PREDICTIONS_ENDPOINT); // Rollback
        }
    };

    return {
        predictions: predictionsMap,
        loading: isLoading,
        error,
        savePrediction,
        deletePrediction,
        refresh: () => mutate(PREDICTIONS_ENDPOINT)
    };
};
