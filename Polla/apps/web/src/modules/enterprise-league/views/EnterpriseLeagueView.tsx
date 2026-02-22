'use client';
import React, { useEffect, useState } from 'react';
import { EnterpriseLeagueHome } from '../components/EnterpriseLeagueHome';
import api from '@/lib/api';
import { Loader2, Shield } from 'lucide-react';
import { PaymentMethods } from '@/components/dashboard/PaymentMethods';
import { Button } from '@/components/ui/button';

export const EnterpriseLeagueView = ({ leagueId }: { leagueId: string }) => {
    const [data, setData] = useState<{ league: any, participants: any[], analytics?: any, matches: any[] } | null>(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [metaRes, rankRes, analyticsRes, matchesRes] = await Promise.all([
                    api.get(`/leagues/${leagueId}`),
                    api.get(`/leagues/${leagueId}/ranking`),
                    api.get(`/leagues/${leagueId}/analytics`).catch(() => ({ data: { departmentRanking: [] } })),
                    api.get(`/leagues/${leagueId}/matches`).catch(() => ({ data: [] }))
                ]);

                const participants = Array.isArray(rankRes.data) ? rankRes.data.map((item: any, index: number) => ({
                    id: item.userId || item.id || item.user?.id,
                    nickname: item.nickname || item.user?.nickname || 'Participante',
                    avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                    points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                    rank: index + 1,
                    department: item.department || item.user?.department
                })) : [];

                setData({ 
                    league: metaRes.data, 
                    participants, 
                    analytics: analyticsRes.data,
                    matches: matchesRes.data.matches || matchesRes.data || []
                });
            } catch (e) {
                console.error(e);
            }
        };
        load();
    }, [leagueId]);

    if (!data) return (
        <div className="flex h-screen items-center justify-center bg-[#0F172A]">
            <Loader2 className="animate-spin text-white" />
        </div>
    );

    if (data.league.userStatus === 'REJECTED') {
        const currentLeague = data.league;
        return (
            <div className="absolute inset-x-0 bottom-0 top-0 z-50 bg-[#0F172A] flex flex-col items-center justify-start p-6 pt-24 text-center animate-in fade-in duration-500 overflow-y-auto">
                <div className="bg-[#1E293B] border border-white/10 p-8 rounded-3xl shadow-2xl max-w-sm w-full relative overflow-hidden flex flex-col items-center justify-center">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50"></div>
                    
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                        <Shield className="w-8 h-8 text-red-500" />
                    </div>
                    
                    <h2 className="text-2xl font-black text-white mb-2 uppercase italic tracking-tight">
                        PAGO <span className="text-red-500">RECHAZADO</span>
                    </h2>
                    
                    <p className="text-slate-400 mb-6 leading-relaxed text-xs">
                        Hubo un problema con tu comprobante para la polla <span className="text-white font-bold">{currentLeague.name}</span>. Por favor, intenta subirlo de nuevo.
                    </p>
                    
                    <div className="w-full flex flex-col gap-4">
                        <PaymentMethods 
                            leagueId={currentLeague.id} 
                            amount={
                                (() => {
                                  const type = (currentLeague.packageType || '').toLowerCase();
                                  // Enterprise Plans
                                  if (type === 'bronze' || type === 'enterprise_bronze') return 100000;
                                  if (type === 'silver' || type === 'enterprise_silver') return 175000;
                                  if (type === 'gold' || type === 'enterprise_gold') return 450000;
                                  if (type === 'platinum' || type === 'enterprise_platinum') return 750000;
                                  if (type === 'diamond' || type === 'enterprise_diamond') return 1000000;

                                  // Social Plans (fallback)
                                  if (type === 'parche' || type === 'amateur') return 30000;
                                  if (type === 'amigos' || type === 'semi-pro') return 80000;
                                  if (type === 'lider' || type === 'pro') return 180000;
                                  if (type === 'influencer' || type === 'elite') return 350000;

                                  return 50000;
                                })()
                            }
                            onSuccess={() => window.location.reload()} 
                        />
                        <Button 
                            variant="ghost" 
                            className="text-slate-500 hover:text-white text-xs underline"
                            onClick={() => window.location.href = '/empresa/mis-pollas'}
                        >
                            Volver a Mis Pollas
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-[#0F172A]">
            <EnterpriseLeagueHome 
                league={data.league} 
                participants={data.participants} 
                analytics={data.analytics} 
                matches={data.matches}
            />
        </div>
    );
};
