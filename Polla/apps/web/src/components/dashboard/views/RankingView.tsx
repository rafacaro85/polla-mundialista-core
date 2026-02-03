import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalRankingTable } from '@/modules/core-dashboard/components/GlobalRankingTable';
import { SocialRankingTable } from '@/modules/social-league/components/SocialRankingTable';
import { EnterpriseRankingTable } from '@/modules/enterprise-league/components/EnterpriseRankingTable';
import { GroupStageView } from '@/components/GroupStageView';
import { Users, Globe } from 'lucide-react';

interface RankingViewProps {
    leagueId?: string;
    isEnterpriseMode?: boolean;
    currentLeague?: any;
    matches?: any[];
}

const getPlanLevel = (type?: string) => {
    if (!type) return 1;
    const t = type.toUpperCase();
    if (t.includes('DIAMOND') || t.includes('DIAMANTE')) return 5;
    if (t.includes('PLATINUM') || t.includes('PLATINO')) return 4;
    if (t.includes('BUSINESS_CORP')) return 4;
    if (t.includes('GOLD') || t.includes('ORO')) return 3;
    if (t.includes('SILVER') || t.includes('PLATA')) return 2;
    if (t.includes('BUSINESS_GROWTH')) return 2;
    return 1;
};

export const RankingView: React.FC<RankingViewProps> = ({
    leagueId,
    isEnterpriseMode,
    currentLeague,
    matches = []
}) => {
    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            <Tabs defaultValue="participants" className="w-full h-full flex flex-col">
                <TabsList className="grid w-full grid-cols-2 mb-4 bg-[#1E293B] p-1 h-auto rounded-xl border border-[#334155]">
                    <TabsTrigger 
                        value="participants"
                        className="data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                    >
                        <Users size={16} />
                        Participantes
                    </TabsTrigger>
                    <TabsTrigger 
                        value="fifa"
                        className="data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                    >
                        <Globe size={16} />
                        Tabla de posiciones
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="participants" className="flex-1 overflow-y-auto mt-0 custom-scrollbar pb-24">
                     {leagueId === 'global' ? (
                        <GlobalRankingTable />
                      ) : isEnterpriseMode && leagueId ? (
                        <EnterpriseRankingTable
                          leagueId={leagueId}
                          enableDepartmentWar={currentLeague?.enableDepartmentWar && getPlanLevel(currentLeague?.packageType) >= 4}
                        />
                      ) : leagueId ? (
                        <SocialRankingTable leagueId={leagueId} />
                      ) : null}
                </TabsContent>

                <TabsContent value="fifa" className="flex-1 overflow-y-auto mt-0 custom-scrollbar pb-24">
                    <GroupStageView matches={matches} />
                </TabsContent>
            </Tabs>
        </div>
    );
};
