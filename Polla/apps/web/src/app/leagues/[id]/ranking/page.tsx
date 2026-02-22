'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { EnterpriseRankingTable } from '@/modules/enterprise-league/components/EnterpriseRankingTable';
import { GroupStageView } from '@/components/GroupStageView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { Loader2, Users, Globe } from 'lucide-react';

export default function RankingPage() {
    const params = useParams();
    const [league, setLeague] = useState<any>(null);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metaRes, matchesRes] = await Promise.all([
                    api.get(`/leagues/${params.id}/metadata`),
                    api.get(`/leagues/${params.id}/matches`)
                ]);
                setLeague(metaRes.data.league);
                setMatches(matchesRes.data || []);
            } catch (error) {
                console.error("Error fetching data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params.id]);

    if (loading) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00E676]" size={32} />
            </div>
        );
    }

    return (
        <div className="p-0 md:p-4 h-full flex flex-col">
            <Tabs defaultValue="participants" className="w-full h-full flex flex-col">
                 <div className="px-4 pt-2">
                    <TabsList 
                        className="grid w-full grid-cols-2 mb-4 p-1 h-auto rounded-xl border gap-1"
                        style={{ 
                            backgroundColor: 'var(--brand-secondary, #1E293B)',
                            borderColor: 'var(--brand-accent, #334155)'
                        }}
                    >
                        <TabsTrigger 
                            value="participants"
                            className="data-[state=active]:text-[var(--brand-bg,#0F172A)] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all tab-trigger-brand"
                        >
                            <style>{`
                                [data-state=active].tab-trigger-brand { 
                                    background-color: var(--brand-primary, #00E676) !important; 
                                    box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--brand-primary), transparent 60%) !important;
                                }
                            `}</style>
                            <Users size={16} />
                            Participantes
                        </TabsTrigger>
                        <TabsTrigger 
                            value="fifa"
                            className="data-[state=active]:text-[var(--brand-bg,#0F172A)] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all tab-trigger-brand"
                        >
                            <Globe size={16} />
                            Tabla de posiciones
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="participants" className="flex-1 mt-0 pb-24">
                    <EnterpriseRankingTable
                        leagueId={params.id as string}
                        enableDepartmentWar={league?.enableDepartmentWar}
                    />
                </TabsContent>

                <TabsContent value="fifa" className="flex-1 mt-0 px-4 pb-24 overflow-y-auto custom-scrollbar">
                    <GroupStageView matches={matches} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
