'use client';

import React, { useEffect, useState } from 'react';
import { DashboardClient } from '@/components/DashboardClient';
import api from '@/lib/api';
import { Loader2 } from 'lucide-react';
import { LeagueHomeView } from '@/components/LeagueHomeView';
import { useAppStore } from '@/store/useAppStore';

interface PageProps {
    params: {
        id: string;
    };
}

export default function LeagueDashboardPage({ params }: PageProps) {
    const [league, setLeague] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { setSelectedLeagueId } = useAppStore();

    useEffect(() => {
        const init = async () => {
            // Sincronizar store
            setSelectedLeagueId(params.id);

            try {
                // Obtenemos los detalles de la liga para saber si es empresa
                const { data: myLeagues } = await api.get('/leagues/my');
                const found = myLeagues.find((l: any) => l.id === params.id);

                if (found) {
                    setLeague(found);

                    // Si es empresa, cargamos participantes para su Home View
                    if (found.type === 'COMPANY' || found.isEnterprise) {
                        try {
                            const { data: rankData } = await api.get(`/leagues/${params.id}/ranking`);

                            // Mapeo seguro de participantes
                            const mapped = Array.isArray(rankData) ? rankData.map((item: any, index: number) => ({
                                id: item.id || item.user?.id,
                                nickname: item.nickname || item.user?.nickname || 'Participante',
                                avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                                points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                                rank: index + 1
                            })) : [];
                            setParticipants(mapped);
                        } catch (e) {
                            console.error("Error loading enterprise participants", e);
                        }
                    }
                }
            } catch (error) {
                console.error("Error initializing league page", error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [params.id, setSelectedLeagueId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00E676]" size={40} />
            </div>
        );
    }

    if (!league) {
        // Fallback robusto: si no encontramos la liga en 'my', intentamos cargar DashboardClient
        // esperando que él maneje el error o permisos, o redirigimos.
        return (
            <DashboardClient
                defaultLeagueId={params.id}
                initialTab="home"
            />
        );
    }

    const isEnterprise = league.type === 'COMPANY' || league.isEnterprise;

    if (isEnterprise) {
        // MODO EMPRESA: Renderizado simple, sin Shell de Dashboard.
        // El Layout externo (apps/web/src/app/leagues/[id]/layout.tsx) ya provee el Sidebar y Header.
        return (
            <div className="p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <LeagueHomeView league={league} participants={participants} />
            </div>
        );
    }

    // MODO POLLAS NORMALES: Dashboard SPA completo.
    return (
        <DashboardClient
            defaultLeagueId={params.id}
            initialTab="home"
        />
    );
}
