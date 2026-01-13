import React from 'react';
import { Shield, Trophy, Users, PlayCircle, Trophy as RankingIcon, ArrowLeft, ArrowRight, Lock, Megaphone, MessageCircle, Swords, Instagram, Facebook, Linkedin, Zap, CheckCircle2, Crown, Youtube, Globe, Share2 } from 'lucide-react';
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

// Helper for Plan Levels
const getPlanLevel = (type?: string) => {
    if (!type) return 1;
    const t = type.toUpperCase();
    if (t.includes('DIAMOND') || t.includes('DIAMANTE')) return 5;
    if (t.includes('PLATINUM') || t.includes('PLATINO')) return 4;
    if (t.includes('BUSINESS_CORP')) return 4; // Legacy
    if (t.includes('GOLD') || t.includes('ORO')) return 3;
    if (t.includes('SILVER') || t.includes('PLATA')) return 2;
    if (t.includes('BUSINESS_GROWTH')) return 2; // Legacy
    return 1;
};

const EnterpriseFeatureLock = ({ title, minPlanName, icon: Icon }: any) => {
    return (
        <div className="w-full bg-slate-900/40 border border-slate-800 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 relative overflow-hidden group hover:border-slate-700 transition-colors">
            <div className="absolute inset-0 bg-[#0F172A]/60 z-10 backdrop-blur-[1px]"></div>
            <div className="relative z-20 flex flex-col items-center">
                <div className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center mb-3 border border-slate-700 shadow-xl group-hover:scale-110 transition-transform">
                    <Icon size={24} className="text-slate-500" />
                    <div className="absolute -bottom-1 -right-1 bg-slate-700 rounded-full p-1 border border-slate-900">
                        <Lock size={12} className="text-[#FACC15]" />
                    </div>
                </div>
                <h3 className="text-slate-200 font-bold uppercase tracking-wider text-sm">{title}</h3>
                <p className="text-slate-400 text-xs max-w-[250px] mt-2 leading-relaxed">
                    Funcionalidad exclusiva del plan <span className="text-[#00E676] font-bold">{minPlanName}</span>.
                    <br />Actualiza tu plan para desbloquear.
                </p>
                <button
                    onClick={() => window.open(`https://wa.me/573100000000?text=Hola,%20quiero%20mejorar%20el%20plan%20de%20mi%20empresa`, '_blank')}
                    className="mt-5 px-6 py-2 bg-slate-800 hover:bg-[#00E676] text-white hover:text-[#0F172A] border border-slate-600 hover:border-[#00E676] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg cursor-pointer"
                >
                    Mejorar Plan
                </button>
            </div>
        </div>
    );
};

export function EnterpriseLeagueHome({ league, participants }: EnterpriseLeagueHomeProps) {
    const router = useRouter();
    const { user } = useAppStore();
    const nickname = (user?.nickname || user?.fullName?.split(' ')[0] || 'JUGADOR').toUpperCase();
    const planLevel = getPlanLevel(league.packageType);

    return (
        <div className="flex flex-col gap-8 font-sans pb-32 min-h-screen bg-[#0F172A] px-4 md:px-0">

            {/* --- FEATURE: BANNERS (DIAMOND - Level 5) --- */}
            {planLevel >= 5 ? (
                <div className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 p-3 text-center shadow-lg relative overflow-hidden animate-in slide-in-from-top-4 rounded-b-xl md:rounded-xl md:mt-4 max-w-4xl mx-auto">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                    <p className="relative z-10 text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2">
                        <Megaphone size={14} className="animate-bounce" />
                        Espacio Publicitario Reservado para {league.companyName}
                    </p>
                </div>
            ) : null}

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

                            {/* SOCIAL MEDIA SECTION (SILVER - Level 2) */}
                            {planLevel >= 2 ? (
                                <div className="flex flex-wrap justify-center gap-3 mt-4 animate-in fade-in slide-in-from-bottom-2">
                                    {league.socialInstagram && (
                                        <a href={league.socialInstagram} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-pink-600/20 hover:text-pink-500 hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <Instagram size={20} className="text-slate-300 group-hover:text-pink-500 transition-colors" />
                                        </a>
                                    )}
                                    {league.socialFacebook && (
                                        <a href={league.socialFacebook} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-blue-600/20 hover:text-blue-500 hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <Facebook size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                                        </a>
                                    )}
                                    {league.socialLinkedin && (
                                        <a href={league.socialLinkedin} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-blue-700/20 hover:text-blue-600 hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <Linkedin size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                                        </a>
                                    )}
                                    {league.socialWhatsapp && (
                                        <a href={league.socialWhatsapp} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-green-600/20 hover:text-green-500 hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <MessageCircle size={20} className="text-slate-300 group-hover:text-green-500 transition-colors" />
                                        </a>
                                    )}
                                    {league.socialYoutube && (
                                        <a href={league.socialYoutube} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-red-600/20 hover:text-red-500 hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <Youtube size={20} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                                        </a>
                                    )}
                                    {league.socialTiktok && (
                                        <a href={league.socialTiktok} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-black/40 hover:text-white hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <Share2 size={20} className="text-slate-300 group-hover:text-white transition-colors" />
                                        </a>
                                    )}
                                    {league.socialWebsite && (
                                        <a href={league.socialWebsite} target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-white/5 hover:bg-purple-600/20 hover:text-purple-500 hover:scale-110 transition-all border border-white/5 shadow-lg group">
                                            <Globe size={20} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-slate-900/60 rounded-xl border border-slate-700/50 backdrop-blur-sm">
                                    <Lock size={12} className="text-slate-500" />
                                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Redes Soc. Bloqueadas</span>
                                </div>
                            )}
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

                {/* --- FEATURE: MURO SOCIAL (GOLD - Level 3) --- */}
                {planLevel >= 3 ? (
                    <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-[#FACC15]/30 transition-all cursor-not-allowed opacity-80 shadow-xl">
                        {/* Placeholder UI */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-russo text-white uppercase text-xs flex items-center gap-2 tracking-widest">
                                <MessageCircle size={14} className="text-[#FACC15]" /> Muro Social
                            </h3>
                            <span className="text-[9px] bg-green-900/50 text-green-400 px-2 py-0.5 rounded border border-green-800/50 font-bold uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                En Vivo
                            </span>
                        </div>
                        <div className="space-y-4 opacity-50 blur-[1px] group-hover:blur-0 transition-all duration-500">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-2 bg-slate-700 rounded w-1/3"></div>
                                    <div className="h-10 bg-slate-800 rounded-lg w-full"></div>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-700"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-2 bg-slate-700 rounded w-1/4"></div>
                                    <div className="h-8 bg-slate-800 rounded-lg w-3/4"></div>
                                </div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Zap size={24} className="text-[#FACC15] mb-2" />
                            <p className="text-white text-xs font-bold uppercase tracking-widest">Disponible Próximamente</p>
                        </div>
                    </div>
                ) : (
                    <EnterpriseFeatureLock title="Muro Social & Chat" minPlanName="ORO" icon={MessageCircle} />
                )}

                {/* 4. PREMIO (Full Width) */}
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-2 mb-4 pl-2">
                        <Trophy size={18} className="text-[#00E676]" />
                        <h3 className="text-white text-sm font-black uppercase tracking-[0.2em] italic">Premio Mayor</h3>
                    </div>
                    {/* PrizeHero handles the image display. If no image, it shows a trophy placeholder. */}
                    <PrizeHero league={league} />
                </div>

                {/* --- FEATURE: GUERRA DE ÁREAS (PLATINUM - Level 4) --- */}
                {planLevel >= 4 ? (
                    <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-6 relative shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-russo text-white uppercase text-xs flex items-center gap-2 tracking-widest">
                                <Swords size={14} className="text-red-500" /> Guerra de Áreas
                            </h3>
                            <span className="text-[9px] bg-red-900/30 text-red-400 px-2 py-0.5 rounded border border-red-800/30 font-bold uppercase">Competencia Activa</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                                    <span className="font-bold flex items-center gap-1">1. Ventas <Crown className="w-3 h-3 text-yellow-500" /></span>
                                    <span className="font-black text-[#00E676]">1450 pts</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-[#00E676] w-[85%] shadow-[0_0_10px_rgba(0,230,118,0.5)]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                                    <span className="font-bold">2. Marketing</span>
                                    <span className="font-black text-yellow-500">1200 pts</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-yellow-500 w-[65%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between text-[10px] text-slate-300 mb-1">
                                    <span className="font-bold">3. Finanzas</span>
                                    <span className="font-black text-blue-500">980 pts</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-blue-500 w-[45%]"></div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-3 border-t border-white/5 text-center">
                            <button className="text-[10px] text-slate-400 hover:text-white uppercase font-bold tracking-widest flex items-center justify-center gap-1 mx-auto transition-colors">
                                Ver Tabla Completa <ArrowRight size={10} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <EnterpriseFeatureLock title="Guerra de Áreas" minPlanName="PLATINO" icon={Swords} />
                )}

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

                {/* --- FEATURE: BANNERS LOCK (If < Level 5 and we want to show lock at bottom) --- */}
                {planLevel < 5 && (
                    <div className="opacity-70 hover:opacity-100 transition-opacity">
                        <EnterpriseFeatureLock title="Publicidad Exclusiva" minPlanName="DIAMANTE" icon={Megaphone} />
                    </div>
                )}

            </div>
        </div>
    );
}
