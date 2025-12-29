import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const useLeague = (id: string | undefined | null) => {
    const [league, setLeague] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            return;
        }

        const fetchLeague = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const { data } = await api.get(`/leagues/${id}/metadata`);
                if (data && data.league) {
                    setLeague(data.league);
                } else {
                    throw new Error('League not found');
                }
            } catch (err: any) {
                console.error("Error fetching league", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeague();
    }, [id]);

    return { league, isLoading, error };
};
