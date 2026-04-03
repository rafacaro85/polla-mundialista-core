import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GlobalRankingTable } from '@/modules/core-dashboard/components/GlobalRankingTable';
import { SocialRankingTable } from '@/modules/social-league/components/SocialRankingTable';
import { EnterpriseRankingTable } from '@/modules/enterprise-league/components/EnterpriseRankingTable';
import { GroupStageView } from '@/components/GroupStageView';
import { Users, Globe } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';

interface RankingViewProps {
    leagueId?: string;
    isEnterpriseMode?: boolean;
    currentLeague?: any;
    matches?: any[];
    tournamentId?: string;
}

const getPlanLevel = (type?: string) => {
    if (!type) return 0;
    const t = type.trim().toLowerCase();
    const levels: Record<string, number> = {
        'familia': 0, 'starter': 0, 'free': 0,
        'parche': 1, 'amateur': 1,
        'amigos': 2, 'semi-pro': 2,
        'lider': 3, 'pro': 3,
        'influencer': 4, 'elite': 4,
        'legend': 5,
        'bronce': 2, 'plata': 3, 'oro': 4, 'platino': 5, 'diamante': 5,
        'enterprise_launch': 2, 'enterprise_bronze': 2, 'enterprise_silver': 3,
        'enterprise_gold': 4, 'enterprise_platinum': 5, 'enterprise_diamond': 5,
        'business_growth': 2, 'business_corp': 4,
    };
    return levels[t] ?? 0;
};

export const RankingView: React.FC<RankingViewProps> = ({
    leagueId,
    isEnterpriseMode,
    currentLeague,
    matches = [],
    tournamentId: propTournamentId
}) => {
    // Priority: Prop > Hook
    const hookTournament = useTournament();
    const tournamentId = propTournamentId || hookTournament.tournamentId;
    const isChampions = tournamentId === 'UCL2526';

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            <Tabs defaultValue="participants" className="w-full h-full flex flex-col">
                <TabsList className={`w-full mb-4 bg-[#1E293B] p-1 h-auto rounded-xl border border-[#334155] ${isChampions ? 'flex' : 'grid grid-cols-2'}`}>
                    <TabsTrigger 
                        value="participants"
                        className="w-full data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                    >
                        <Users size={16} />
                        Participantes
                    </TabsTrigger>
                    
                    {!isChampions && (
                        <TabsTrigger 
                            value="fifa"
                            className="data-[state=active]:bg-[#00E676] data-[state=active]:text-[#0F172A] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                        >
                            <Globe size={16} />
                            Tabla de posiciones
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="participants" className="flex-1 overflow-y-auto mt-0 custom-scrollbar pb-24">
                     {leagueId === 'global' ? (
                        // Ranking global deshabilitado — flujo nuevo usa mis-pollas
                        null
                      ) : isEnterpriseMode && leagueId ? (
                        <EnterpriseRankingTable
                          leagueId={leagueId}
                          enableDepartmentWar={currentLeague?.enableDepartmentWar && getPlanLevel(currentLeague?.packageType) >= 4}
                        />
                      ) : leagueId ? (
                        <SocialRankingTable leagueId={leagueId} />
                      ) : null}
                </TabsContent>

                {!isChampions && (
                    <TabsContent value="fifa" className="flex-1 overflow-y-auto mt-0 custom-scrollbar pb-24">
                        <GroupStageView matches={matches} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};
