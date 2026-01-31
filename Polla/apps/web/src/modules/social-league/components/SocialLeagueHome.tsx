import React from 'react';
import { Shield, Trophy, Users, PlayCircle, Trophy as RankingIcon, Lock } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { PrizeHero } from '@/components/PrizeHero';
import { useAppStore } from '@/store/useAppStore';
import { SocialWallWidget } from '@/components/SocialWallWidget';
import { PromoBanner } from '@/components/PromoBanner';

interface SocialLeagueHomeProps {
    league: any;
    participants: any[];
    onTabChange: (tab: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus' | 'muro') => void;
    onNavigateToLeagues?: () => void;
    onNavigateToBusiness?: () => void;
}

export const SocialLeagueHome: React.FC<SocialLeagueHomeProps> = ({ league, participants, onTabChange, onNavigateToLeagues, onNavigateToBusiness }) => {
    const { user } = useAppStore();
    if (!league) return null;

    const nickname = user?.nickname || 'Jugador';
    const packageType = (league.packageType || 'familia').toLowerCase();


    return (
        <div className="flex flex-col gap-8 font-sans pb-32">

            {/* 1. WELCOME HEADER (Premium Custom) */}
            <div className="flex flex-col gap-1 pt-4 text-center">
                <p className="text-[#00E676] text-xs font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-2">
                    ¡HOLA, {nickname.toUpperCase()}!
                </p>
                <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-none italic">
                    BIENVENIDO A LA <span className="text-[#00E676]">POLLA</span> <br />
                    {league.name.toUpperCase()} <br />
                    <span className="text-slate-500 text-sm italic tracking-widest font-russo uppercase">Mundialista 2026</span>
                </h1>
            </div>

            {/* 2. HERO HEADER (Social Style: Clean, Modern, Mobile First) */}
            <header className="relative w-full min-h-[12rem] bg-gradient-to-br from-slate-900 to-[#1e293b] border border-white/5 flex flex-col items-center justify-center p-6 gap-4 overflow-hidden rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] text-center animate-in zoom-in-95 duration-500 mt-2">
                {/* Background Decor */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#00E676] opacity-10 blur-[60px] rounded-full"></div>

                {/* Icono de la Polla */}
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="w-24 h-24 bg-gradient-to-br from-[#1E293B] to-[#0F172A] rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                        {league.brandingLogoUrl ? (
                            <img
                                src={league.brandingLogoUrl}
                                alt={league.name}
                                className="w-full h-full object-contain p-2"
                            />
                        ) : (
                            <Shield className="w-12 h-12 text-[#00E676] drop-shadow-[0_0_15px_rgba(0,230,118,0.5)]" strokeWidth={1.5} />
                        )}
                    </div>
                    <div className="mt-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-[0.1em]">{league.name}</h2>
                        <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="px-2 py-[2px] bg-[#00E676]/10 text-[#00E676] text-[10px] font-black rounded border border-[#00E676]/20 uppercase tracking-widest">Polla Activa</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* SOCIAL MEDIA LINKS */}
            {(league.socialInstagram || league.socialFacebook || league.socialTiktok || league.socialYoutube || league.socialWhatsapp || league.socialLinkedin || league.socialWebsite) && (
                <div className="flex flex-wrap justify-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                    {league.socialInstagram && (
                        <a href={league.socialInstagram} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-pink-600 rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">📸</span>
                        </a>
                    )}
                    {league.socialFacebook && (
                        <a href={league.socialFacebook} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-blue-600 rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">👍</span>
                        </a>
                    )}
                    {league.socialTiktok && (
                        <a href={league.socialTiktok} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-black rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">🎵</span>
                        </a>
                    )}
                    {league.socialYoutube && (
                        <a href={league.socialYoutube} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-red-600 rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">📺</span>
                        </a>
                    )}
                    {league.socialWhatsapp && (
                        <a href={league.socialWhatsapp} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-green-500 rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">💬</span>
                        </a>
                    )}
                    {league.socialLinkedin && (
                        <a href={league.socialLinkedin} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-blue-700 rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">💼</span>
                        </a>
                    )}
                    {league.socialWebsite && (
                        <a href={league.socialWebsite} target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-[#1E293B] hover:bg-emerald-500 rounded-full flex items-center justify-center text-white border border-white/10 transition-colors shadow-lg">
                            <span className="text-xl">🌐</span>
                        </a>
                    )}
                </div>
            )}

            {/* 3. SHORTCUT CARDS (Modern Grid) */}
            <div className="grid grid-cols-2 gap-3">
                <button
                    onClick={() => onTabChange('game')}
                    className="group bg-[#1E293B] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#00E676]/50 transition-all hover:translate-y-[-2px] shadow-lg overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-[#00E676]/10 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-10 h-10 bg-[#00E676]/10 rounded-xl flex items-center justify-center group-hover:bg-[#00E676] transition-colors">
                        <PlayCircle className="w-6 h-6 text-[#00E676] group-hover:text-[#0F172A]" />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Predecir ahora</span>
                </button>

                <button
                    onClick={() => onTabChange('ranking')}
                    className="group bg-[#1E293B] border border-white/5 p-4 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-[#FACC15]/50 transition-all hover:translate-y-[-2px] shadow-lg overflow-hidden relative"
                >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-yellow-500/10 rounded-bl-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="w-10 h-10 bg-yellow-500/10 rounded-xl flex items-center justify-center group-hover:bg-yellow-500 transition-colors">
                        <RankingIcon className="w-6 h-6 text-yellow-500 group-hover:text-[#0F172A]" />
                    </div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Ver Ranking</span>
                </button>
            </div>

            <div className="flex flex-col gap-6">

                {/* 4. PREMIO */}
                {(league.prizeImageUrl || league.prizeDetails) && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy size={16} className="text-[#00E676]" />
                            <h3 className="text-white text-xs font-black uppercase tracking-widest italic">Premio Mayor</h3>
                        </div>
                        <PrizeHero league={league} />
                    </div>
                )}

                {/* PROMO BANNER (Solo en Plan Familia/Gratis) */}
                {['familia', 'free'].includes(packageType) && (
                    <div className="mb-4">
                        <PromoBanner
                            onActionSocial={onNavigateToLeagues}
                            onActionEnterprise={onNavigateToBusiness}
                        />
                    </div>
                )}

                {/* 5. PARTICIPANTES (Resumen) */}
                <div className="bg-[#1E293B] border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[40px] rounded-full translate-x-10 translate-y-[-20px]"></div>
                    <div className="flex items-center gap-4 relative z-10">
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <Users size={24} className="text-indigo-400" />
                        </div>
                        <div>
                            <h4 className="text-white font-black text-sm uppercase tracking-wide">Participantes</h4>
                            <p className="text-slate-400 text-xs font-bold">{participants.length} usuarios compitiendo</p>
                        </div>
                    </div>
                    {/* Avatares apilados */}
                    <div className="flex -space-x-3 overflow-hidden relative z-10">
                        {participants.slice(0, 4).map((p, i) => (
                            <Avatar key={p.id} className="inline-block h-10 w-10 border-2 border-[#1E293B] transition-transform hover:scale-110" style={{ zIndex: 10 - i }}>
                                <AvatarImage src={p.avatarUrl} />
                                <AvatarFallback className="bg-slate-700 text-xs font-bold text-white">{p.nickname?.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                        ))}
                        {participants.length > 4 && (
                            <div className="h-10 w-10 border-2 border-[#1E293B] bg-slate-800 flex items-center justify-center text-[10px] text-[#00E676] font-black rounded-full shadow-lg">
                                +{participants.length - 4}
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. TOP RANKING SHORT */}
                <div className="bg-[#1E293B] border border-white/5 rounded-2xl overflow-hidden shadow-2xl relative">
                    <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
                        <h3 className="font-russo italic text-white uppercase text-xs flex items-center gap-2 tracking-widest">
                            <RankingIcon size={14} className="text-yellow-500" />
                            TOP Líderes
                        </h3>
                        <button onClick={() => onTabChange('ranking')} className="text-[10px] font-black text-[#00E676] uppercase tracking-widest border-b border-dashed border-[#00E676]">Ver todos</button>
                    </div>
                    <Table>
                        <TableBody>
                            {participants.sort((a, b) => (b.points || 0) - (a.points || 0)).slice(0, 3).map((participant, index) => (
                                <TableRow key={participant.id || index} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <TableCell className="w-10 text-center relative py-5">
                                        <span className={`font-russo italic text-lg ${index === 0 ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]' :
                                            index === 1 ? 'text-slate-300' : 'text-amber-600'
                                            }`}>
                                            {index + 1}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className={`h-8 w-8 border-2 ${index === 0 ? 'border-yellow-400' : 'border-slate-700'}`}>
                                                <AvatarImage src={participant.avatarUrl} />
                                                <AvatarFallback className="text-[10px] font-bold">{participant.nickname?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <span className="font-bold text-white text-sm group-hover:text-[#00E676] transition-colors">{participant.nickname}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right py-5 px-6">
                                        <div className="flex flex-col items-end">
                                            <span className="font-russo text-[#00E676] text-sm tracking-widest">
                                                {participant.points !== undefined ? participant.points : participant.totalPoints || 0}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Puntos</span>
                                        </div>
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
