'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, TrendingUp } from 'lucide-react';

export default function LeagueAdminAnalyticsPage() {
    const params = useParams();
    const router = useRouter();
    const leagueId = params.id as string;

    return (
        <div className="min-h-screen text-white" style={{ backgroundColor: 'var(--brand-bg, #0F172A)' }}>
            <div className="p-6 border-b" style={{ backgroundColor: 'var(--brand-secondary, #1E293B)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => router.back()}
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <TrendingUp className="text-[var(--brand-primary,#10B981)]" /> Analítica
                    </h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-8">
                <div className="flex flex-col items-center justify-center p-20 border border-white/5 border-dashed rounded-xl bg-black/10 text-center">
                    <div className="w-16 h-16 bg-[var(--brand-primary,#10B981)]/10 rounded-full flex items-center justify-center mb-6">
                        <TrendingUp className="w-8 h-8 text-[var(--brand-primary,#10B981)]" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Próximamente</h2>
                    <p className="text-slate-400 max-w-sm">
                        Estamos preparando un panel detallado de estadísticas de participación y engagement para tu empresa.
                    </p>
                </div>
            </div>
        </div>
    );
}
