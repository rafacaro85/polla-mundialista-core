'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Loader2, Trophy, Users, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrizeHero } from '@/components/PrizeHero';
import { SocialWallWidget } from '@/components/SocialWallWidget';

// This page now acts as the "Home" / "Landing" of the league.
// It receives the layout context (Theme & Nav).

export default function LeagueLandingPage() {
    const params = useParams();
    const router = useRouter(); // For manual routing if needed
    const [league, setLeague] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch data again? 
    // Ideally we share state with layout, but fetching again is safer for independent component lifecycle
    // or we could use a context. For now, simple fetch.
    useEffect(() => {
        const load = async () => {
            try {
                // Get detailed league info (using same endpoints as before)
                // Note: Layout handles global branding. This page handles CONTENT.

                // 1. League
                const { data: myLeagues } = await api.get('/leagues/my');
                let found = myLeagues.find((l: any) => l.id === params.id);
                setLeague(found);

                // 2. Ranking / Participants
                const { data: rankingData } = await api.get(`/leagues/${params.id}/ranking`);
                const mapped = Array.isArray(rankingData) ? rankingData.map((item: any, index: number) => ({
                    id: item.id || item.user?.id,
                    nickname: item.nickname || item.user?.nickname || 'Anónimo',
                    avatarUrl: item.avatarUrl || item.user?.avatarUrl,
                    points: item.totalPoints !== undefined ? item.totalPoints : item.points,
                    rank: index + 1
                })) : [];
                setParticipants(mapped);

            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) load();
    }, [params.id]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-brand-primary" /></div>;
    if (!league) return null;

    const isEnterprise = league.type === 'COMPANY' || league.isEnterprise;
    const isActive = league.isEnterpriseActive;

    return (
        <div className="flex flex-col gap-8 min-h-screen bg-transparent font-sans">

            {/* 1. HERO HEADER (Branding) */}
            <header className="relative w-full min-h-[12rem] md:min-h-[16rem] bg-gradient-to-r from-obsidian to-carbon border-b border-white/5 flex flex-col md:flex-row items-center justify-between px-6 py-8 gap-6 overflow-hidden outline outline-1 outline-white/5 mx-auto rounded-b-3xl md:rounded-3xl md:mt-4 md:w-[95%] shadow-2xl">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/20 blur-[100px] rounded-full pointer-events-none"></div>

                {/* Logo & Identity */}
                {isEnterprise && league.brandingLogoUrl ? (
                    <div className="relative z-10 w-32 h-32 md:w-48 md:h-32 flex-shrink-0 animate-in zoom-in duration-500">
                        <img src={league.brandingLogoUrl} alt="Logo" className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" />
                    </div>
                ) : (
                    <div className="relative z-10 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <Shield className="w-16 h-16 text-brand-primary" strokeWidth={1} />
                    </div>
                )}

                {/* Title Section */}
                <div className="relative z-10 text-center md:text-right flex-1">
                    <h1 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter drop-shadow-sm">
                        {league.name}
                    </h1>
                    {isEnterprise && league.companyName && (
                        <p className="text-brand-primary font-bold tracking-widest uppercase text-sm mt-2 opacity-90">
                            {league.companyName}
                        </p>
                    )}
                </div>
            </header>

            <div className="md:w-[95%] mx-auto w-full px-4 flex flex-col lg:flex-row gap-8 pb-20">

                {/* LEFT COLUMN: PRIZE & WALL (2/3 width) */}
                <div className="flex-1 flex flex-col gap-8">

                    {/* 2. PRIZE SECTION */}
                    <div className="animate-in slide-in-from-bottom-4 duration-700 delay-100">
                        <PrizeHero league={league} />
                    </div>

                    {/* 3. PARTICIPANT LIST (Read Only) */}
                    <div className="bg-carbon border border-white/5 rounded-2xl overflow-hidden shadow-lg animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <h3 className="font-russo text-white uppercase text-lg flex items-center gap-2">
                                <Trophy size={20} className="text-yellow-500" />
                                Top 10 Ranking
                            </h3>
                            <button className="text-xs font-bold text-brand-primary uppercase hover:underline">
                                Ver Ranking Completo
                            </button>
                        </div>
                        <Table>
                            <TableBody>
                                {participants.slice(0, 10).map((participant) => (
                                    <TableRow key={participant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="w-12 text-center font-bold text-lg text-slate-400">
                                            {participant.rank === 1 ? '🥇' : participant.type === 2 ? '🥈' : participant.rank === 3 ? '🥉' : participant.rank}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8 border border-white/10">
                                                    <AvatarImage src={participant.avatarUrl} />
                                                    <AvatarFallback>{participant.nickname.substring(0, 2)}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-white text-sm">{participant.nickname}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-russo text-brand-primary">
                                            {participant.points} <span className="text-[10px] text-slate-500">PTS</span>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                </div>

                {/* RIGHT COLUMN: WIDGETS (1/3 width) */}
                <aside className="w-full lg:w-96 flex flex-col gap-8">

                    {/* SOCIAL WALL WIDGET */}
                    {(isEnterprise && isActive) && (
                        <div className="animate-in slide-in-from-right-4 duration-700 delay-300">
                            <SocialWallWidget leagueId={params.id as string} />
                        </div>
                    )}

                    {/* INFO WIDGET */}
                    <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-2xl p-6 text-center">
                        <Users size={32} className="text-indigo-400 mx-auto mb-3" />
                        <h4 className="text-white font-bold uppercase text-sm mb-1">Comunidad Activa</h4>
                        <p className="text-indigo-200/60 text-xs">
                            {participants.length} participantes compitiendo por la gloria.
                        </p>
                    </div>

                </aside>

            </div>
        </div>
    );
}
