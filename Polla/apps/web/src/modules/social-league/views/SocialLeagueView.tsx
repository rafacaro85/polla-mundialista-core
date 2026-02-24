/**
 * @deprecated
 * Este archivo ya NO se usa. La ruta /leagues/[id] ahora redirige
 * directamente a /leagues/[id]/predictions sin pasar por DashboardClient.
 *
 * PENDIENTE DE ELIMINACIÓN: verificar en producción → eliminar en próxima sesión.
 */

import { DashboardClient } from '@/components/DashboardClient';

export const SocialLeagueView = ({ leagueId }: { leagueId: string }) => {
    return (
        <div className="w-full min-h-screen bg-[#0F172A]">
            <DashboardClient defaultLeagueId={leagueId} initialTab="home" />
        </div>
    );
};
