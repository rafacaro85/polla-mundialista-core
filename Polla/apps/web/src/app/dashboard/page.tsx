'use client';

import { Suspense } from 'react';
import { DashboardClient } from '@/components/DashboardClient';

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-emerald-400">Cargando Dashboard...</div>}>
            <DashboardClient />
        </Suspense>
    );
}
