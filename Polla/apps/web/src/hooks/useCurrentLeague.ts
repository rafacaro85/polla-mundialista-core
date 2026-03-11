import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useLeagues } from './useLeagues';

export const useCurrentLeague = (selectedLeagueId: string | undefined, activeTab: string) => {
    const [currentLeague, setCurrentLeague] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Use useLeagues to get robust user-specific data like isAdmin
    const { leagues } = useLeagues();

    // Fetch Current League Metadata
    useEffect(() => {
        const fetchCurrentLeague = async () => {
            if (selectedLeagueId && selectedLeagueId !== 'global') {
                // RESET IMMEDIATELY: clear stale league data so guard blocks render
                setCurrentLeague(null);
                setIsLoading(true);
                try {
                    // Find basic info in loaded leagues list to get isAdmin/code reliably
                    const existingLeagueInfo = leagues.find(l => l.id === selectedLeagueId);

                    // FETCH FULL DETAILS (Previous: /metadata) to get userStatus
                    const { data } = await api.get(`/leagues/${selectedLeagueId}`);
                    console.log('🔍 [useCurrentLeague] League Full Details Received:', data);
                    
                    // Merge API metadata with local list data if available (prioritize list for isAdmin)
                    // The GET /leagues/:id endpoint returns the league object directly
                    const mergedLeague = {
                        ...data,
                        isAdmin: existingLeagueInfo ? existingLeagueInfo.isAdmin : data.isAdmin,
                        code: existingLeagueInfo ? existingLeagueInfo.code : data.code,
                        userStatus: data.userStatus // Ensure this is captured
                    };

                    setCurrentLeague(mergedLeague);
                } catch (error) {
                    console.error('Error fetching league metadata', error);
                    setCurrentLeague(null);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setCurrentLeague(null);
                setIsLoading(false);
            }
        };
        fetchCurrentLeague();
    }, [selectedLeagueId, leagues]);

    // Fetch Participants for Home Tab
    useEffect(() => {
        const fetchParticipants = async () => {
            if (activeTab === 'home' && selectedLeagueId && selectedLeagueId !== 'global') {
                try {
                    const { data } = await api.get(`/leagues/${selectedLeagueId}/ranking`);
                    const mapped = Array.isArray(data) ? data.map((item: any, index: number) => ({
                        id: item.id || item.user?.id,
                        nickname: item.nickname || item.user?.nickname || 'Anónimo',
                        avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                        points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                        rank: index + 1
                    })) : [];
                    setParticipants(mapped);
                } catch (error) {
                    console.error("Error fetching participants for home", error);
                }
            }
        };
        fetchParticipants();
    }, [activeTab, selectedLeagueId]);

    const isEnterpriseMode = currentLeague && (currentLeague.type === 'COMPANY' || currentLeague.isEnterprise);
    const isWallEnabled = currentLeague && ['lider', 'influencer', 'pro', 'elite', 'legend'].includes((currentLeague.packageType || '').toLowerCase());

    return {
        currentLeague,
        participants,
        isEnterpriseMode,
        isWallEnabled,
        isLoading
    };
};
