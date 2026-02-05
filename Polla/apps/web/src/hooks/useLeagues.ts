import { useState, useCallback, useEffect } from 'react';
import api from '@/lib/api';

export interface League {
    id: string;
    name: string;
    members: number;
    admin: string;
    isAdmin: boolean;
    initial: string;
    code: string;
    maxParticipants: number;
    participantCount?: number;
    type?: string;
    isEnterprise?: boolean;
    isEnterpriseActive?: boolean;
    isPaid?: boolean;
}

export const useLeagues = () => {
    const [leagues, setLeagues] = useState<League[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLeagues = useCallback(async () => {
        try {
            setLoading(true);
            const tournamentId = process.env.NEXT_PUBLIC_APP_THEME === 'CHAMPIONS' ? 'UCL2526' : 'WC2026';
            const { data } = await api.get('/leagues/my', { params: { tournamentId } });

            // Map API data to local interface
            const mappedLeagues = data.map((l: any) => ({
                id: l.id,
                name: l.name,
                members: l.participantCount || 0,
                admin: l.isAdmin ? 'Tú' : (l.admin?.nickname || 'Admin'),
                isAdmin: l.isAdmin,
                initial: l.name.charAt(0).toUpperCase(),
                code: l.code,
                maxParticipants: l.maxParticipants,
                type: l.type,
                isEnterprise: l.isEnterprise,
                isEnterpriseActive: l.isEnterpriseActive,
                isPaid: l.isPaid
            }));

            setLeagues(mappedLeagues);
        } catch (error) {
            console.error('Error loading leagues', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLeagues();
    }, [fetchLeagues]);

    const socialLeagues = leagues.filter(l => !l.isEnterprise);
    const enterpriseLeagues = leagues.filter(l => l.isEnterprise);

    return {
        leagues,
        loading,
        fetchLeagues,
        socialLeagues,
        enterpriseLeagues
    };
};
