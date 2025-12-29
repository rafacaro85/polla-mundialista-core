'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useLeague } from '@/shared/hooks/useLeague';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

// 1. IMPORTACIÓN DINÁMICA (Lazy Loading) con Named Exports
const SocialLeagueView = dynamic(
    () => import('@/modules/social-league/views/SocialLeagueView')
        .then((mod) => mod.SocialLeagueView),
    {
        ssr: false,
        loading: () => <div className="flex h-screen items-center justify-center bg-[#0F172A]"><LoadingSpinner /></div>
    }
);

const EnterpriseLeagueView = dynamic(
    () => import('@/modules/enterprise-league/views/EnterpriseLeagueView')
        .then((mod) => mod.EnterpriseLeagueView),
    {
        ssr: false,
        loading: () => <div className="flex h-screen items-center justify-center bg-[#0F172A]"><LoadingSpinner /></div>
    }
);

export default function LeagueDispatcherPage() {
    const params = useParams();
    const leagueId = (Array.isArray(params?.id) ? params?.id[0] : params?.id) as string;

    const { league, isLoading, error } = useLeague(leagueId);

    // 2. ESTADOS DE CARGA DEL DATA FETCHING
    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-[#0F172A]">
                <LoadingSpinner />
            </div>
        );
    }

    if (error || !league) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center text-white bg-[#0F172A]">
                <h2 className="text-xl font-bold text-red-500">Error de conexión</h2>
                <p>No pudimos cargar la liga.</p>
                <button onClick={() => window.location.reload()} className="mt-4 rounded bg-gray-700 px-4 py-2 hover:bg-gray-600">
                    Reintentar
                </button>
            </div>
        );
    }

    // 3. EL DISPATCHER (Switch)
    console.log('League Loaded:', league.type);

    const isEnterprise = league.type === 'COMPANY' || league.isEnterprise;

    if (isEnterprise) {
        return <EnterpriseLeagueView leagueId={leagueId} />;
    }

    // Default: SOCIAL
    return <SocialLeagueView leagueId={leagueId} />;
}
