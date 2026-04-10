'use client';

import { useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { DashboardClient } from '@/components/DashboardClient';

export default function DashboardPage() {
    const router = useRouter();
    const { selectedLeagueId } = useAppStore();

    useEffect(() => {
        // Si estamos en la raíz del dashboard sin liga, enviamos a Mis Pollas (Social)
        if (selectedLeagueId === 'global') {
            router.replace('/social/mis-pollas');
        }
    }, [selectedLeagueId, router]);

    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-emerald-400">Cargando Dashboard...</div>}>
            <DashboardClient />
        </Suspense>
    );
}
