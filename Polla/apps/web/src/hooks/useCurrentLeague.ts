import { useState, useEffect } from 'react';
import api from '@/lib/api';

export const useCurrentLeague = (selectedLeagueId: string | undefined, activeTab: string) => {
    const [currentLeague, setCurrentLeague] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);

    // Fetch Current League Metadata
    useEffect(() => {
        const fetchCurrentLeague = async () => {
            if (selectedLeagueId && selectedLeagueId !== 'global') {
                try {
                    const { data } = await api.get(`/leagues/${selectedLeagueId}/metadata`);
                    console.log('🔍 [useCurrentLeague] League Metadata Received:', data.league);
                    setCurrentLeague(data.league);
                } catch (error) {
                    console.error('Error fetching league metadata', error);
                    setCurrentLeague(null);
                }
            } else {
                setCurrentLeague(null);
            }
        };
        fetchCurrentLeague();
    }, [selectedLeagueId]);

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
        isWallEnabled
    };
};
