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
            const targetLeagueId = leagueId || null;

            // 1. Cargar TODAS las predicciones como base (si hay varias para un partido, se irán sobreescribiendo)
            data.forEach((p: any) => {
                const mId = p.matchId || p.match?.id;
                const pLeagueId = p.leagueId || null;

                if (mId) {
                    // Si estamos en Dash General (targetLeagueId === null), aceptamos CUALQUIER liga como visualización
                    // Si estamos en una liga específica, el punto 2 la sobreescribirá
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

            // 2. Si estamos en una liga específica, sobreescribir con las predicciones de esa liga
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
    }, [data, leagueId]);

    // DEFINIMOS PRIMERO DELETE PARA QUE SAVE PUEDA USARLO
    const deletePrediction = async (matchId: string) => {
        // INTELIGENCIA: Detectar el leagueId correcto de la predicción que estamos viendo
        const existingPrediction = predictionsMap[matchId];
        // Si hay una predicción cargada en el mapa, usamos su leagueId. Si no, usamos el del contexto.
        const targetLeagueId = existingPrediction?.leagueId !== undefined
            ? existingPrediction.leagueId
            : (leagueId || null);

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

    const savePrediction = async (matchId: string, homeScore: number | null | string, awayScore: number | null | string, isJoker: boolean = false, phase?: string) => {
        // CASO DE BORRADO: Si los marcadores están vacíos
        if ((homeScore === null || homeScore === '' || homeScore === undefined) &&
            (awayScore === null || awayScore === '' || awayScore === undefined)) {
            return deletePrediction(matchId);
        }

        // INTELIGENCIA: Mantener consistencia de liga
        // Si ya existe una predicción para este partido visualizada, usar su leagueId para el update
        const existingPrediction = predictionsMap[matchId];
        const targetLeagueId = existingPrediction?.leagueId !== undefined
            ? existingPrediction.leagueId
            : (leagueId || null);

        // Cast to number for API
        const hScore = Number(homeScore);
        const aScore = Number(awayScore);

        // Optimistic object
        const optimisticPrediction = {
            matchId,
            match: { id: matchId, phase },
            leagueId: targetLeagueId,
            homeScore: hScore,
            awayScore: aScore,
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
                homeScore: hScore,
                awayScore: aScore,
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

    const clearAllPredictions = async () => {
        const targetLeagueId = leagueId || null;

        // Mutate local cache immediately (optimistic)
        mutate(PREDICTIONS_ENDPOINT, (currentData: any) => {
            const list = Array.isArray(currentData) ? [...currentData] : [];
            // Remove all matches where leagueId matches targetLeagueId
            return list.filter((p: any) => (p.leagueId || null) !== targetLeagueId);
        }, false);

        try {
            const url = targetLeagueId
                ? `/predictions/all/clear?leagueId=${targetLeagueId}`
                : `/predictions/all/clear`;
            await api.delete(url);
            mutate(PREDICTIONS_ENDPOINT);
            toast.success('Todas las predicciones han sido eliminadas');
        } catch (err: any) {
            console.error(err);
            toast.error('Error al limpiar predicciones');
            mutate(PREDICTIONS_ENDPOINT); // Rollback
        }
    };

    const saveBulkPredictions = async (aiPredictions: Record<string, { h: number, a: number }>) => {
        const targetLeagueId = leagueId || null;
        const entries = Object.entries(aiPredictions);

        // Save all without intermediate revalidations
        const promises = entries.map(([mId, { h, a }]) => {
            return api.post('/predictions', {
                matchId: mId,
                homeScore: h,
                awayScore: a,
                leagueId: targetLeagueId
            });
        });

        try {
            await Promise.all(promises);
            await mutate(PREDICTIONS_ENDPOINT);
            toast.success(`${entries.length} predicciones guardadas correctamente`);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar predicciones masivas');
            mutate(PREDICTIONS_ENDPOINT);
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
        refresh: () => mutate(PREDICTIONS_ENDPOINT)
    };
};
