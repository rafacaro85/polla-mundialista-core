import useSWR, { mutate } from 'swr';
import React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

const PREDICTIONS_ENDPOINT = '/predictions/me';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export const useMyPredictions = (leagueId?: string, tournamentId?: string) => {
    // Secondary state to force re-renders when SWR mutate is slow to notify
    const [lastUpdate, setLastUpdate] = React.useState(0);

    // Dynamic key ensures we fetch predictions specific to the current context (Global or League)
    const swrKey = leagueId && leagueId !== 'global'
        ? `/predictions/me?leagueId=${leagueId}&tournamentId=${tournamentId || 'WC2026'}`
        : `/predictions/me?tournamentId=${tournamentId || 'WC2026'}`;

    const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
        revalidateOnFocus: false, 
        revalidateOnReconnect: false, 
        dedupingInterval: 5000 
    });

    const predictionsMap = React.useMemo(() => {
        const map: Record<string, any> = {};
        if (Array.isArray(data)) {
            const targetLeagueId = leagueId || null;

            data.forEach((p: any) => {
                const mId = p.matchId || p.match?.id;
                const pLeagueId = p.leagueId || null;

                if (mId) {
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

            if (targetLeagueId !== null) {
                data.forEach((p: any) => {
                    const mId = p.matchId || p.match?.id;
                    const pLeagueId = p.leagueId || null;

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
        }
        return map;
    }, [data, leagueId, lastUpdate]); // Identity change on lastUpdate forces consumers to update

    const deletePrediction = async (matchId: string) => {
        const existingPrediction = predictionsMap[matchId];
        const targetLeagueId = existingPrediction?.leagueId !== undefined
            ? existingPrediction.leagueId
            : (leagueId || null);

        await mutate((currentData: any) => {
            const list = Array.isArray(currentData) ? [...currentData] : [];
            return list.filter((p: any) =>
                !((p.matchId === matchId || p.match?.id === matchId) &&
                    (p.leagueId || null) === targetLeagueId)
            );
        }, false);
        setLastUpdate(prev => prev + 1);

        try {
            const url = targetLeagueId
                ? `/predictions/${matchId}?leagueId=${targetLeagueId}`
                : `/predictions/${matchId}`;
            await api.delete(url);
            
            await mutate();
            setLastUpdate(prev => prev + 1);
            
            toast.success('Predicción eliminada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error eliminando predicción');
            mutate(); 
        }
    };

    const savePrediction = async (matchId: string, homeScore: number | null | string, awayScore: number | null | string, isJoker: boolean = false, phase?: string) => {
        if ((homeScore === null || homeScore === '' || homeScore === undefined) &&
            (awayScore === null || awayScore === '' || awayScore === undefined)) {
            return deletePrediction(matchId);
        }

        const targetLeagueId = leagueId || null;
        const hScore = Number(homeScore);
        const aScore = Number(awayScore);

        const optimisticPrediction = {
            matchId,
            match: { id: matchId, phase },
            leagueId: targetLeagueId,
            homeScore: hScore,
            awayScore: aScore,
            isJoker,
            points: 0
        };

        mutate((currentData: any) => {
            let list = Array.isArray(currentData) ? [...currentData] : [];
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
        setLastUpdate(prev => prev + 1);

        try {
            await api.post('/predictions', {
                matchId,
                homeScore: hScore,
                awayScore: aScore,
                isJoker,
                leagueId: targetLeagueId
            });
            mutate(); 
            toast.success('Predicción guardada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error guardando predicción');
            mutate(); 
        }
    };

    const clearAllPredictions = async (tournamentId?: string) => {
        const targetLeagueId = leagueId || null;

        await mutate((currentData: any) => {
            if (!Array.isArray(currentData)) return [];
            return currentData.filter((p: any) => {
                const matchesLeague = (p.leagueId || null) === targetLeagueId;
                let matchesTournament = true;
                if (tournamentId) {
                    const pTid = p.tournamentId || p.match?.tournamentId;
                    matchesTournament = !pTid || pTid === tournamentId;
                }
                return !(matchesLeague && matchesTournament);
            });
        }, false);
        setLastUpdate(prev => prev + 1);

        try {
            const url = targetLeagueId
                ? `/predictions/all/clear?leagueId=${targetLeagueId}`
                : `/predictions/all/clear`;
            
            let finalUrl = url;
            if (tournamentId) {
                const cleanTid = tournamentId.trim().split(',')[0];
                finalUrl += (finalUrl.includes('?') ? '&' : '?') + `tournamentId=${cleanTid}`;
            }

            await api.delete(finalUrl);
            
            // Refetch and force identity change for UI updates
            await mutate();
            setLastUpdate(prev => prev + 1);
            
            toast.success('Todas las predicciones han sido eliminadas');
        } catch (err: any) {
            console.error(err);
            toast.error('Error al limpiar predicciones');
            mutate();
        }
    };

    const saveBulkPredictions = async (aiPredictions: Record<string, { h: number, a: number }>) => {
        const targetLeagueId = leagueId && leagueId !== 'global' ? leagueId : null;
        const entries = Object.entries(aiPredictions);

        const predictionsList = entries.map(([mId, { h, a }]) => ({
            matchId: mId.trim(),
            homeScore: h,
            awayScore: a,
            leagueId: targetLeagueId,
            isJoker: false 
        }));

        try {
            await api.post('/predictions/bulk', { predictions: predictionsList });
            await mutate();
            setLastUpdate(prev => prev + 1);
            toast.success(`${entries.length} predicciones guardadas`);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar predicciones');
            mutate();
        }
    };

    return {
        predictions: predictionsMap,
        loading: isLoading,
        error,
        savePrediction,
        saveBulkPredictions,
        deletePrediction,
        clearAllPredictions,
        refresh: () => {
            mutate();
            setLastUpdate(prev => prev + 1);
        }
    };
};
