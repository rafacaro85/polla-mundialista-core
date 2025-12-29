'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';

// Vistas
import { DashboardClient } from '@/components/DashboardClient';
import { EnterpriseLeagueHome } from '@/modules/enterprise-league/components/EnterpriseLeagueHome';

// Componente Spinner Local (para cumplir requerimiento de <Spinner />)
const LoadingSpinner = () => (
    <div className="flex items-center justify-center min-h-screen bg-[#0F172A]">
        <Loader2 className="w-10 h-10 animate-spin text-[#00E676]" />
    </div>
);

// Hook personalizado para lógica de carga
const useLeagueData = (leagueId: string) => {
    const [league, setLeague] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        if (!leagueId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 1. Obtener Metadata Simple
                const { data: meta } = await api.get(`/leagues/${leagueId}/metadata`);
                const foundLeague = meta.league;

                if (!foundLeague) throw new Error("League not found");

                setLeague(foundLeague);

                // 2. Si es Enterprise, cargar participantes (necesario para su Home)
                const isEnterprise = foundLeague.type === 'COMPANY' || foundLeague.isEnterprise;
                if (isEnterprise) {
                    try {
                        const { data: rankData } = await api.get(`/leagues/${leagueId}/ranking`);
                        const mapped = Array.isArray(rankData) ? rankData.map((item: any, index: number) => ({
                            id: item.id || item.user?.id,
                            nickname: item.nickname || item.user?.nickname || 'Participante',
                            avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                            points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                            rank: index + 1
                        })) : [];
                        setParticipants(mapped);
                    } catch (e) {
                        console.error("Error loading participants for enterprise", e);
                    }
                }
            } catch (err) {
                console.error("Error loading league data", err);
                setError(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [leagueId]);

    return { league, participants, isLoading, error };
};

export default function LeagueDispatcherPage() {
    const params = useParams();
    const id = Array.isArray(params?.id) ? params?.id[0] : params?.id; // Seguridad para params

    const { setSelectedLeagueId } = useAppStore();
    const { league, participants, isLoading, error } = useLeagueData(id as string);

    // Sincronizar ID en Store
    useEffect(() => {
        if (id) setSelectedLeagueId(id);
    }, [id, setSelectedLeagueId]);

    // 1. Loading
    if (isLoading) return <LoadingSpinner />;

    // 2. Error
    if (error || !league) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0F172A] text-white">
                <p>No pudimos cargar la liga.</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-white/10 rounded hover:bg-white/20"
                >
                    Reintentar
                </button>
            </div>
        );
    }

    // 3. Dispatcher (Switch)
    const isEnterprise = league.type === 'COMPANY' || league.isEnterprise;

    if (isEnterprise) {
        // Si tienes un wrapper "EnterpriseLeagueView", úsalo aquí. Falta de wrapper === Home Directo.
        return (
            <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <EnterpriseLeagueHome league={league} participants={participants} />
            </div>
        );
    }

    // Default: Social League (DashboardClient)
    return (
        <DashboardClient
            defaultLeagueId={id}
            initialTab="home"
        />
    );
}
