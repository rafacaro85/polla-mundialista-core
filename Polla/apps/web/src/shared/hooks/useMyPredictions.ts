import useSWR, { mutate } from 'swr';
import React from 'react';
import api from '@/lib/api';
import { toast } from 'sonner';

const PREDICTIONS_ENDPOINT = '/predictions/me';

const fetcher = (url: string) => api.get(url).then(res => res.data);

export const useMyPredictions = (leagueId?: string) => {
    // Dynamic key ensures we fetch predictions specific to the current context (Global or League)
    const swrKey = leagueId && leagueId !== 'global'
        ? `/predictions/me?leagueId=${leagueId}`
        : '/predictions/me';

    const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
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
        mutate((currentData: any) => {
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
            mutate();
            toast.success('Predicción eliminada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error eliminando predicción');
            mutate(); // Rollback
        }
    };

    const savePrediction = async (matchId: string, homeScore: number | null | string, awayScore: number | null | string, isJoker: boolean = false, phase?: string) => {
        // CASO DE BORRADO: Si los marcadores están vacíos
        if ((homeScore === null || homeScore === '' || homeScore === undefined) &&
            (awayScore === null || awayScore === '' || awayScore === undefined)) {
            return deletePrediction(matchId);
        }

        // LOGIC FIX: Always use the current context's leagueId for saving.
        // If we are in a League, we SAVE to that League (creating an override if needed).
        // If we are Global, we SAVE to Global.
        // We do NOT inherit the ID from the existing prediction, because that prevents divergence.
        const targetLeagueId = leagueId || null;

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
        mutate((currentData: any) => {
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
            mutate(); // Revalidate real data
            toast.success('Predicción guardada');
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Error guardando predicción');
            mutate(); // Rollback
        }
    };

    const clearAllPredictions = async () => {
        const targetLeagueId = leagueId || null;

        // Mutate local cache immediately (optimistic)
        mutate((currentData: any) => {
            const list = Array.isArray(currentData) ? [...currentData] : [];
            // Remove all matches where leagueId matches targetLeagueId
            return list.filter((p: any) => (p.leagueId || null) !== targetLeagueId);
        }, false);

        try {
            const url = targetLeagueId
                ? `/predictions/all/clear?leagueId=${targetLeagueId}`
                : `/predictions/all/clear`;
            await api.delete(url);
            mutate();
            toast.success('Todas las predicciones han sido eliminadas');
        } catch (err: any) {
            console.error(err);
            toast.error('Error al limpiar predicciones');
            mutate(); // Rollback
        }
    };

    const saveBulkPredictions = async (aiPredictions: Record<string, { h: number, a: number }>) => {
        // STRATEGY CHANGE: Bulk predictions (AI) save to GLOBAL scope by default,
        // so they propagate to all leagues (Inheritance).
        // Specific overrides happen when user manually edits single matches in a league context.
        const targetLeagueId = null;
        const entries = Object.entries(aiPredictions);

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
            await mutate();
            toast.success(`${entries.length} predicciones guardadas (Global)`);
        } catch (err) {
            console.error(err);
            toast.error('Error al guardar predicciones masivas');
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
        refresh: () => mutate()
    };
};
