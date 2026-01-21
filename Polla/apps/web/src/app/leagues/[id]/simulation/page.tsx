'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GroupStageView } from '@/components/GroupStageView';
import { BracketView } from '@/components/BracketView';
import { Loader2, Table, Trophy } from 'lucide-react';
import api from '@/lib/api';

export default function SimulationPage() {
    const params = useParams();
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'groups' | 'bracket'>('groups');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [matchesRes, leagueRes] = await Promise.all([
                    api.get(`/leagues/${params.id}/matches`),
                    api.get(`/leagues/${params.id}`)
                ]);

                let matchesData = matchesRes.data || [];
                const leagueData = leagueRes.data;

                // FIX: Para ligas empresariales, limpiar los equipos hardcodeados en fases finales
                // para que el simulador funcione desde cero (calculando cruces dinámicamente).
                // Respetamos la orden de "no tocar las otras".
                if (leagueData.isEnterprise) {
                    matchesData = matchesData.map((m: any) => {
                        // Si es fase KO y el partido no ha terminado, limpiar contendientes
                        if (['ROUND_32', 'ROUND_16', 'QUARTER', 'SEMI', 'FINAL', '3RD_PLACE'].includes(m.phase) && m.status !== 'FINISHED') {
                            return { ...m, homeTeam: null, awayTeam: null };
                        }
                        return m;
                    });
                }

                setMatches(matchesData);
            } catch (error) {
                console.error('Error loading simulation data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (params.id) {
            loadData();
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
            {/* Tabs */}
            <div className="sticky top-0 z-20 bg-brand-bg/95 backdrop-blur-xl border-b border-brand-secondary">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="flex gap-2 py-4">
                        <button
                            onClick={() => setActiveTab('groups')}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${activeTab === 'groups'
                                ? 'bg-brand-primary text-obsidian shadow-[0_0_15px_rgba(0,0,0,0.3)]'
                                : 'bg-brand-secondary text-slate-400 hover:text-brand-text'
                                }`}
                        >
                            <Table size={20} />
                            <span className="text-sm">Tabla de Grupos</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('bracket')}
                            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold uppercase tracking-wide transition-all ${activeTab === 'bracket'
                                ? 'bg-brand-primary text-obsidian shadow-[0_0_15px_rgba(0,0,0,0.3)]'
                                : 'bg-brand-secondary text-slate-400 hover:text-brand-text'
                                }`}
                        >
                            <Trophy size={20} />
                            <span className="text-sm">Fase Final</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pb-24 md:pb-0">
                {activeTab === 'groups' && <GroupStageView matches={matches} />}
                {activeTab === 'bracket' && <BracketView matches={matches} leagueId={params.id as string} />}
            </div>
        </div>
    );
}
