import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SocialFixture } from '@/modules/social-league/components/SocialFixture';
import { BracketView } from '@/components/BracketView';
import { Calendar, Activity } from 'lucide-react';
import { useTournament } from '@/hooks/useTournament';


interface PredictionsViewProps {
    matchesData: any;
    matches: any[];
    isLoadingMatches: boolean;
    onRefresh: () => void;
    isRefreshing: boolean;
    leagueId?: string;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({
    matchesData,
    matches,
    isLoadingMatches,
    onRefresh,
    isRefreshing,
    leagueId
}) => {
    const { tournamentId } = useTournament();
    const isHeimcore = tournamentId === 'HEIMCORE';

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-300">
            <Tabs defaultValue="matches" className="w-full h-full flex flex-col">
                <TabsList className={`w-full mb-4 bg-[#1E293B] p-1 h-auto rounded-xl border border-[#334155] ${isHeimcore ? 'flex' : 'grid grid-cols-2'}`}>

                    <TabsTrigger 
                        value="matches"
                        className="data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F172A)] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                    >
                        <Calendar size={16} />
                        {isHeimcore ? 'Partido' : 'Partidos'}
                    </TabsTrigger>
                    {!isHeimcore && (
                        <TabsTrigger 
                            value="bracket"
                            className="data-[state=active]:bg-[var(--brand-primary,#00E676)] data-[state=active]:text-[var(--brand-bg,#0F172A)] text-slate-400 py-2.5 rounded-lg text-xs font-black uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                        >
                            <Activity size={16} />
                            Llaves
                        </TabsTrigger>
                    )}
                </TabsList>


                <TabsContent value="matches" className="flex-1 overflow-visible mt-0">
                    <SocialFixture
                        matchesData={matchesData}
                        loading={isLoadingMatches}
                        onRefresh={onRefresh}
                        isRefreshing={isRefreshing}
                        leagueId={leagueId}
                    />
                </TabsContent>

                {!isHeimcore && (
                    <TabsContent value="bracket" className="flex-1 overflow-y-auto mt-0 custom-scrollbar pb-24">
                       <BracketView
                          matches={matches.map((m: any) => ({
                            ...m,
                            homeTeam: typeof m.homeTeam === 'object' ? (m.homeTeam as any).code : m.homeTeam,
                            awayTeam: typeof m.awayTeam === 'object' ? (m.awayTeam as any).code : m.awayTeam,
                            homeFlag: typeof m.homeTeam === 'object' ? (m.homeTeam as any).flag : m.homeFlag,
                            awayFlag: typeof m.awayTeam === 'object' ? (m.awayTeam as any).flag : m.awayFlag,
                            homeTeamPlaceholder: m.homeTeamPlaceholder,
                            awayTeamPlaceholder: m.awayTeamPlaceholder,
                          }))}
                          leagueId={leagueId}
                        />
                    </TabsContent>
                )}

            </Tabs>
        </div>
    );
};
