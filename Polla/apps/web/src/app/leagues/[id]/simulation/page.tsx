'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GroupStageView } from '@/components/GroupStageView';
import { Loader2 } from 'lucide-react';
import api from '@/lib/api';

export default function SimulationPage() {
    const params = useParams();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                const { data } = await api.get(`/leagues/${params.id}/matches`);
                setMatches(data);
            } catch (error) {
                console.error('Error fetching matches:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            fetchMatches();
        }
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <Loader2 className="animate-spin text-brand-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-bg">
            <GroupStageView matches={matches} />
        </div>
    );
}
