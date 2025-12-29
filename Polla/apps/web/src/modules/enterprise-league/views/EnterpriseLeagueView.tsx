'use client';
import React, { useEffect, useState } from 'react';
import { EnterpriseLeagueHome } from '../components/EnterpriseLeagueHome';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export const EnterpriseLeagueView = ({ leagueId }: { leagueId: string }) => {
    const [data, setData] = useState<{ league: any, participants: any[] } | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [metaRes, rankRes] = await Promise.all([
                    api.get(`/leagues/${leagueId}/metadata`),
                    api.get(`/leagues/${leagueId}/ranking`)
                ]);

                const participants = Array.isArray(rankRes.data) ? rankRes.data.map((item: any, index: number) => ({
                    id: item.id || item.user?.id,
                    nickname: item.nickname || item.user?.nickname || 'Participante',
                    avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                    points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                    rank: index + 1
                })) : [];

                setData({ league: metaRes.data.league, participants });
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [leagueId]);

    if (!data) return (
        <div className="flex h-screen items-center justify-center">
            <Loader2 className="animate-spin text-white" />
        </div>
    );

    return <EnterpriseLeagueHome league={data.league} participants={data.participants} />;
};
