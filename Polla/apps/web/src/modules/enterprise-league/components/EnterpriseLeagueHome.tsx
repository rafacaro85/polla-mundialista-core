import React from 'react';
import { Shield, Trophy, Users, PlayCircle, Trophy as RankingIcon, ArrowLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { PrizeHero } from '@/components/PrizeHero';
import { useRouter } from 'next/navigation';

interface EnterpriseLeagueHomeProps {
    league: any;
    participants: any[];
}

import { useAppStore } from '@/store/useAppStore';

// ...

export function EnterpriseLeagueHome({ league, participants }: EnterpriseLeagueHomeProps) {
    const router = useRouter();
    const { user } = useAppStore();
    const nickname = (user?.nickname || user?.fullName?.split(' ')[0] || 'JUGADOR').toUpperCase();

    return (
        <div className="flex flex-col gap-8 font-sans pb-32 min-h-screen bg-[#0F172A] px-4 md:px-0">



            {/* 1. WELCOME HEADER (Premium Custom) */}
            <div className="flex flex-col gap-1 pt-8 text-center animate-in slide-in-from-top-4 duration-700">
                <p className="text-[#00E676] text-xs font-black uppercase tracking-[0.3em] mb-2">
                    ¡HOLA, {nickname}!
                </p>
                <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight leading-none italic drop-shadow-2xl">
                    BIENVENIDO A LA POLLA <br />
                    <span className="text-[#00E676] text-2xl md:text-3xl block mt-1">{league.companyName || league.name}</span>
                    <span className="text-slate-500 text-sm italic tracking-widest font-russo uppercase block mt-2">Mundialista 2026</span>
                </h1>
            </div>

            <div className="max-w-md mx-auto w-full flex flex-col gap-8">
                {/* 2. HERO HEADER (Identity Card) */}
                <header className="relative w-full min-h-[14rem] bg-gradient-to-br from-[#1e293b] to-[#0f172a] border border-white/10 flex flex-col items-center justify-center p-6 gap-4 overflow-hidden rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center animate-in zoom-in-95 duration-500">
                    {/* Background Decor */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00E676] opacity-[0.07] blur-[80px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-blue-500 opacity-[0.07] blur-[80px] rounded-full pointer-events-none"></div>

                    {/* Icono de la Empresa */}
                    <div className="relative z-10 flex flex-col items-center gap-4">
                        <div className="w-28 h-28 bg-white rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-500 overflow-hidden p-4">
                            {league.brandingLogoUrl ? (
                                <img
                                    src={league.brandingLogoUrl}
                                    alt={league.companyName}
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <Shield className="w-12 h-12 text-[#00E676]" strokeWidth={1.5} />
                            )}
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <h2 className="text-2xl font-black text-white uppercase tracking-wider font-russo">{league.companyName || league.name}</h2>
                            <span className="px-3 py-1 bg-[#00E676] text-[#0F172A] text-[10px] font-black rounded-full uppercase tracking-[0.2em] shadow-[0_0_15px_rgba(0,230,118,0.4)]">
                                Polla Activa
                            </span>
                        </div>
                    </div>
                </header>

                {/* 3. SHORTCUT CARDS (Modern Grid) */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={() => router.push(`/leagues/${league.id}/predictions`)}
                        className="group bg-[#1E293B] active:scale-95 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#00E676]/50 transition-all hover:-translate-y-1 shadow-xl overflow-hidden relative h-32"
                    >
                        <div className="absolute top-0 right-0 w-10 h-10 bg-[#00E676]/10 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 bg-[#00E676]/10 rounded-2xl flex items-center justify-center group-hover:bg-[#00E676] transition-colors">
                            <PlayCircle className="w-6 h-6 text-[#00E676] group-hover:text-[#0F172A]" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">Predecir<br />Ahora</span>
                    </button>

                    <button
                        onClick={() => {
                            const el = document.getElementById('ranking-list');
                            el?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="group bg-[#1E293B] active:scale-95 border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#FACC15]/50 transition-all hover:-translate-y-1 shadow-xl overflow-hidden relative h-32"
                    >
                        <div className="absolute top-0 right-0 w-10 h-10 bg-yellow-500/10 rounded-bl-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="w-12 h-12 bg-yellow-500/10 rounded-2xl flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                            <RankingIcon className="w-6 h-6 text-yellow-500 group-hover:text-[#0F172A]" />
                        </div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest text-center">Ver<br />Ranking</span>
                    </button>
                </div>

                {/* 4. PREMIO (Full Width) */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-2 mb-4 pl-2">
                        <Trophy size={18} className="text-[#00E676]" />
                        <h3 className="text-white text-sm font-black uppercase tracking-[0.2em] italic">Premio Mayor</h3>
                    </div>
                    {/* PrizeHero handles the image display. If no image, it shows a trophy placeholder. */}
                    <PrizeHero league={league} />
                </div>

                {/* 5. PARTICIPANTS OVERVIEW */}
                <div className="bg-[#1E293B] border border-white/5 rounded-3xl p-6 flex flex-col gap-4 shadow-xl relative overflow-hidden">
                    <div className="flex items-center justify-between z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <Users size={20} className="text-indigo-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-black text-xs uppercase tracking-wide">Participantes</h4>
                                <p className="text-slate-400 text-[10px] font-bold">{participants.length} usuarios compitiendo</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex -space-x-3 overflow-hidden relative z-10 pl-2">
                        {participants.slice(0, 5).map((p, i) => (
                            <Avatar key={p.id} className="inline-block h-10 w-10 border-2 border-[#1E293B] ring-2 ring-white/5" style={{ zIndex: 10 - i }}>
                                <AvatarImage src={p.avatarUrl} />
                                <AvatarFallback className="bg-slate-700 text-[10px] font-bold text-white">{p.nickname?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        ))}
                        {participants.length > 5 && (
                            <div className="h-10 w-10 border-2 border-[#1E293B] bg-slate-800 flex items-center justify-center text-[10px] text-[#00E676] font-black rounded-full shadow-lg z-0">
                                +{participants.length - 5}
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. TOP RANKING TABLE */}
                <div id="ranking-list" className="bg-[#1E293B] border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                        <h3 className="font-russo italic text-white uppercase text-xs flex items-center gap-2 tracking-widest">
                            <RankingIcon size={14} className="text-yellow-500" />
                            TOP Líderes
                        </h3>
                    </div>
                    <Table>
                        <TableBody>
                            {participants.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-8 text-slate-500 text-xs">Aún no hay puntos registrados</TableCell>
                                </TableRow>
                            ) : (
                                participants.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 5).map((participant, index) => (
                                    <TableRow key={participant.id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <TableCell className="w-10 text-center py-4">
                                            <span className={`font-russo text-lg ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-amber-600' : 'text-slate-600'}`}>
                                                {index + 1}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={participant.avatarUrl} />
                                                    <AvatarFallback className="text-[10px]">{participant.nickname?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <span className="font-bold text-white text-xs truncate max-w-[120px]">{participant.nickname}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right px-6">
                                            <div className="flex flex-col items-end">
                                                <span className="font-russo text-[#00E676] text-sm">{participant.points || 0}</span>
                                                <span className="text-[8px] text-slate-500 uppercase font-bold">PTS</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

            </div>
        </div>
    );
}
