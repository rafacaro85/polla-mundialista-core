import React from 'react';
import { Shield, Trophy, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { PrizeHero } from '@/components/PrizeHero'; // Shared UI can remain in components for now

interface SocialLeagueHomeProps {
    league: any;
    participants: any[];
}

export const SocialLeagueHome: React.FC<SocialLeagueHomeProps> = ({ league, participants }) => {
    if (!league) return null;

    return (
        <div className="flex flex-col gap-6 font-sans pb-24">

            {/* 1. HERO HEADER (Social Style: Clean, Modern, Mobile First) */}
            <header className="relative w-full min-h-[14rem] bg-gradient-to-r from-slate-900 to-slate-800 border-b border-white/5 flex flex-col items-center justify-center p-6 gap-4 overflow-hidden rounded-b-3xl shadow-xl text-center">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#00E676] opacity-10 blur-[100px] rounded-full pointer-events-none"></div>

                {/* Icono de la Polla */}
                <div className="relative z-10 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm shadow-inner">
                    <Shield className="w-12 h-12 text-[#00E676]" strokeWidth={1.5} />
                </div>

                {/* Info */}
                <div className="relative z-10 max-w-lg">
                    <h1 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight mb-2">
                        {league.name}
                    </h1>
                    <p className="text-slate-400 text-xs md:text-sm font-medium uppercase tracking-widest">
                        Polla de Amigos
                    </p>
                </div>
            </header>

            <div className="px-4 flex flex-col gap-6">

                {/* 2. MENSAJE / REGLAS */}
                {league.description && (
                    <div className="bg-[#1E293B] border border-white/5 rounded-xl p-5 shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-[#00E676]"></div>
                        <h3 className="text-white font-bold uppercase text-sm mb-3 flex items-center gap-2">
                            📢 Información
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                            {league.description}
                        </p>
                    </div>
                )}

                {/* 3. PARTICIPANTES (Resumen) */}
                <div className="bg-[#1E293B] border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-lg">
                            <Users size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-bold text-sm">Participantes</h4>
                            <p className="text-slate-400 text-xs">{participants.length} Compitiendo</p>
                        </div>
                    </div>
                    {/* Avatares apilados */}
                    <div className="flex -space-x-2 overflow-hidden">
                        {participants.slice(0, 5).map((p) => (
                            <Avatar key={p.id} className="inline-block h-8 w-8 rounded-full ring-2 ring-[#1E293B]">
                                <AvatarImage src={p.avatarUrl} />
                                <AvatarFallback className="bg-slate-700 text-[10px]">{p.nickname?.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                        ))}
                        {participants.length > 5 && (
                            <div className="h-8 w-8 rounded-full ring-2 ring-[#1E293B] bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold">
                                +{participants.length - 5}
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. PREMIO */}
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <PrizeHero league={league} />
                </div>

                {/* 5. TOP RANKING SHORT */}
                <div className="bg-[#1E293B] border border-white/5 rounded-xl overflow-hidden shadow-lg">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-800/50">
                        <h3 className="font-russo text-white uppercase text-sm flex items-center gap-2">
                            <Trophy size={16} className="text-yellow-500" />
                            Líderes
                        </h3>
                    </div>
                    <Table>
                        <TableBody>
                            {participants.slice(0, 5).map((participant, index) => (
                                <TableRow key={participant.id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                    <TableCell className="w-8 text-center font-bold text-sm text-slate-400">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={participant.avatarUrl} />
                                                <AvatarFallback className="text-[10px]">{participant.nickname?.substring(0, 2)}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-white text-xs">{participant.nickname}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-russo text-[#00E676] text-xs">
                                        {participant.points !== undefined ? participant.points : participant.totalPoints || 0} PTS
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

            </div>
        </div>
    );
};
