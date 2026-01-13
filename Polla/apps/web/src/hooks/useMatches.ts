import { useState, useMemo } from 'react';
import useSWR from 'swr';
import api from '@/lib/api';
import { toast } from 'sonner';
import { getTeamFlagUrl } from '@/shared/utils/flags';

interface Match {
    id: string;
    homeTeam: string;
    homeFlag: string;
    awayTeam: string;
    awayFlag: string;
    dateStr: string;
    displayDate: string;
    status: 'SCHEDULED' | 'FINISHED' | 'LIVE';
    date: string;
    homeScore?: number | null;
    awayScore?: number | null;
    prediction?: any;
    userH?: string;
    userA?: string;
    points?: number;
    homeTeamPlaceholder?: string;
    awayTeamPlaceholder?: string;
}

export const useMatches = (predictions: any) => {
    const [isRefreshing, setIsRefreshing] = useState(false);

    // SWR Fetcher
    const fetcher = (url: string) => api.get(url).then(res => res.data);

    // SWR Hooks
    const { data: matchesData, mutate: mutateMatches, isLoading: isLoadingMatchesSWR } = useSWR('/matches/live', fetcher, {
        refreshInterval: 60000, // 1 minute
        revalidateOnFocus: true,
        revalidateIfStale: false,
    });

    // Calculate Merged Matches
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

            const pred = predictions ? predictions[m.id] : undefined;

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
                    isJoker: pred.isJoker,
                    points: pred.points || 0
                } : undefined,
                userH: pred?.homeScore?.toString() || '',
                userA: pred?.awayScore?.toString() || '',
                points: pred?.points || 0
            };
        });
    }, [matchesData, predictions]);

    const handleManualRefresh = async () => {
        setIsRefreshing(true);
        // UX Trick: Minimum 2 seconds animation
        const minWait = new Promise(resolve => setTimeout(resolve, 2000));
        const refreshPromise = mutateMatches();
        await Promise.all([minWait, refreshPromise]);
        setIsRefreshing(false);
        toast.success('Marcadores actualizados');
    };

    return {
        matches,
        matchesData,
        loading: isLoadingMatchesSWR,
        isRefreshing,
        handleManualRefresh
    };
};
