'use client';

/**
 * Ruta raíz: /leagues/[id]
 *
 * Redirige inmediatamente a /leagues/[id]/predictions.
 * El nuevo sistema de rutas /leagues/[id]/* cubre toda la funcionalidad
 * del antiguo DashboardClient. Esta página ya no renderiza SocialLeagueView
 * ni EnterpriseLeagueView directamente.
 */

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

export default function LeagueRootPage() {
    const router = useRouter();
    const params = useParams();
    const leagueId = (Array.isArray(params?.id) ? params?.id[0] : params?.id) as string;

    useEffect(() => {
        if (leagueId) {
            router.replace(`/leagues/${leagueId}/predictions`);
        }
    }, [leagueId, router]);

    // Spinner mientras ocurre el redirect
    return (
        <div className="flex h-screen w-full items-center justify-center bg-[#0F172A]">
            <LoadingSpinner />
        </div>
    );
}
