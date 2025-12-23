import React from 'react';
import { Trophy, Users, Shield } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrizeHero } from './PrizeHero';
import { PhaseProgressDashboard } from './PhaseProgressDashboard';

interface EnterpriseLeagueViewProps {
    league: any;
    participants: any[];
}

export function EnterpriseLeagueView({ league, participants }: EnterpriseLeagueViewProps) {
    return (
        <div className="min-h-screen bg-transparent flex flex-col font-sans">

            {/* 1. CORPORATE HEADER (Full Width, Centered, Huge) */}
            {/* 1. CORPORATE HEADER (Full Width, Centered, Huge) */}
            <header className="w-full py-16 flex flex-col items-center justify-center gap-6 relative overflow-hidden bg-obsidian border-b border-white/5">

                {/* Dynamic Background Cover */}
                {league.brandCoverUrl ? (
                    <>
                        <div
                            className="absolute inset-0 z-0 bg-cover bg-center opacity-40 blur-sm scale-110"
                            style={{ backgroundImage: `url(${league.brandCoverUrl})` }}
                        />
                        <div className="absolute inset-0 z-0 bg-gradient-to-b from-black/60 via-black/40 to-obsidian" />
                    </>
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/20 to-transparent opacity-30" />
                )}

                {league.brandingLogoUrl ? (
                    <div className="relative z-10 w-32 h-32 md:w-40 md:h-40 animate-in fade-in zoom-in duration-700">
                        <img
                            src={league.brandingLogoUrl}
                            alt={league.companyName || "Empresa"}
                            className="w-full h-full object-contain filter drop-shadow-2xl"
                        />
                    </div>
                ) : (
                    <div className="relative z-10">
                        <Shield className="w-32 h-32 text-brand-primary" strokeWidth={1.5} />
                    </div>
                )}

                <div className="text-center z-10 max-w-2xl px-4">
                    <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-[0.2em] text-white text-shadow-lg mb-2">
                        {league.companyName || league.name}
                    </h1>

                    {league.welcomeMessage && (
                        <p className="text-lg md:text-xl text-brand-text font-russo tracking-wider mt-4 leading-relaxed drop-shadow-md">
                            {league.welcomeMessage}
                        </p>
                    )}

                    {!league.welcomeMessage && (
                        <h2 className="text-lg md:text-xl text-white/80 font-russo tracking-wider mt-2">
                            {league.name}
                        </h2>
                    )}
                </div>
            </header>

            {/* 2. PRIZE HERO SECTION */}
            <div className="w-full max-w-6xl mx-auto px-4 -mt-8 relative z-20">
                <PrizeHero league={league} />
            </div>

            {/* 2.5 PHASE PROGRESS */}
            <div className="w-full max-w-4xl mx-auto px-4 mt-8">
                <PhaseProgressDashboard />
            </div>

            {/* 3. PARTICIPANTS LIST (Read Only) */}
            <div className="w-full max-w-4xl mx-auto mt-16 px-4 pb-24">
                <div className="text-center mb-8">
                    <h3 className="text-3xl font-russo text-brand-primary uppercase drop-shadow-md flex items-center justify-center gap-3">
                        <Trophy className="w-8 h-8" /> Tabla de Posiciones
                    </h3>
                    <p className="text-slate-400 text-sm mt-2 font-bold tracking-widest uppercase">
                        {participants.length} Participantes Compitiendo
                    </p>
                </div>

                <div className="bg-carbon/80 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-white/10 bg-black/20 hover:bg-black/20">
                                <TableHead className="w-20 text-center text-white/50 font-bold uppercase text-xs tracking-wider">Rank</TableHead>
                                <TableHead className="text-white/50 font-bold uppercase text-xs tracking-wider">Participante</TableHead>
                                <TableHead className="text-right text-white/50 font-bold uppercase text-xs tracking-wider px-8">Puntos Total</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {participants.sort((a, b) => a.rank - b.rank).map((participant) => (
                                <TableRow key={participant.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="text-center font-russo text-xl py-6 relative">
                                        <span className={
                                            participant.rank === 1 ? 'text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] text-3xl' :
                                                participant.rank === 2 ? 'text-slate-300 text-2xl' :
                                                    participant.rank === 3 ? 'text-amber-600 text-2xl' : 'text-slate-500'
                                        }>
                                            {participant.rank}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <Avatar className={`h-12 w-12 border-2 ${participant.rank === 1 ? 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' : 'border-slate-700'
                                                    }`}>
                                                    {participant.avatarUrl ? (
                                                        <AvatarImage src={participant.avatarUrl} />
                                                    ) : (
                                                        <AvatarFallback className="bg-slate-800 text-sm font-bold text-slate-400">
                                                            {participant.nickname.substring(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                {/* Crown for #1 */}
                                                {participant.rank === 1 && (
                                                    <div className="absolute -top-3 -right-2 transform rotate-12 text-2xl">👑</div>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-lg ${participant.rank <= 3 ? 'text-white' : 'text-slate-300'
                                                    } group-hover:text-brand-primary transition-colors`}>
                                                    {participant.nickname}
                                                </span>
                                                {participant.user?.nickname && participant.user.nickname !== participant.nickname && (
                                                    <span className="text-xs text-slate-500">{participant.user.nickname}</span>
                                                )}
                                                {/* Department if available */}
                                                {/* We don't have department in participant type yet in frontend mapping, but if we did: */}
                                                {/* <span className="text-[10px] uppercase tracking-wider text-slate-500 bg-white/5 px-2 py-0.5 rounded-full w-fit mt-1">Ventas</span> */}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right px-8">
                                        <span className="font-russo text-2xl text-brand-primary tracking-widest">
                                            {participant.points}
                                        </span>
                                        <span className="text-[10px] text-slate-500 block uppercase font-bold">PTS</span>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {participants.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center py-20 text-slate-500">
                                        <div className="flex flex-col items-center gap-4">
                                            <Users size={48} className="opacity-20" />
                                            <p className="text-lg">La competencia aún no comienza</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-12 text-center text-xs text-slate-600 uppercase tracking-widest opacity-50">
                    Powered by Polla Mundialista Enterprise
                </div>
            </div>
        </div>
    );
}
