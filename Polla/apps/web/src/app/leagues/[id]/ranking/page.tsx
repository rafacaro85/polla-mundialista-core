'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { RankingView } from '@/components/RankingView';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function RankingPage() {
    const params = useParams();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const { data } = await api.get(`/leagues/${params.id}/metadata`);
                setLeague(data.league);
            } catch (error) {
                console.error("Error fetching league metadata", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMetadata();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00E676]" size={32} />
            </div>
        );
    }

    return (
        <div className="p-0 md:p-4">
            <RankingView
                leagueId={params.id as string}
                enableDepartmentWar={league?.enableDepartmentWar}
            />
        </div>
    );
}
