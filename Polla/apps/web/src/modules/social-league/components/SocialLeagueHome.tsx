import React from 'react';
import { 
    Shield, Trophy, Users, PlayCircle, Trophy as RankingIcon, Lock,
    Instagram, Facebook, Youtube, MessageCircle, Linkedin, Globe, Music2
} from 'lucide-react';
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
    const isEnterprise = ['bronce', 'plata', 'oro', 'platino', 'diamante'].includes(packageType);


    return (
        <div className="flex flex-col gap-8 font-sans pb-32">

            {/* 1. HERO HERO (Adapted from Enterprise) */}
            <div className="relative h-[480px] md:h-[520px] rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/5 mt-4">
                <img 
                    src={league.brandCoverUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000'} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    alt="Hero" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-[#0F172A]/40 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col items-start gap-4">
                    <p className="text-[#00E676] text-xs font-black uppercase tracking-[0.3em] animate-in fade-in slide-in-from-top-2">
                        ¡HOLA, {nickname.toUpperCase()}!
                    </p>
                    <h2 className="text-4xl md:text-7xl font-black italic uppercase text-white leading-[0.85] tracking-tighter">
                        ¡BIENVENIDO A LA <br /> 
                        <span className="text-[#00E676]">POLLA {league.name.toUpperCase()}!</span>
                    </h2>
                    <p className="text-slate-200 text-sm md:text-lg max-w-lg leading-relaxed font-medium drop-shadow-lg">
                        {league.welcomeMessage || 'Únete a la emoción del fútbol. ¡Pronostica, compite y gana premios exclusivos con tus amigos y familiares!'}
                    </p>
                    <div className="mt-6 flex flex-wrap items-center gap-4 w-full">
                        <button
                            onClick={() => onTabChange('game')}
                            className="bg-[#00E676] text-[#0F172A] px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(0,230,118,0.3)] hover:scale-105 hover:translate-y-[-1px] active:scale-95 transition-all flex items-center gap-3"
                        >
                            <PlayCircle size={22} fill="currentColor" /> INGRESAR A JUGAR
                        </button>
                    </div>
                </div>

                {/* Badge Flotante (Optional Branding) */}
                <div className="absolute top-8 left-8 w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 flex items-center justify-center shadow-2xl overflow-hidden group-hover:rotate-6 transition-transform">
                    {league.brandingLogoUrl ? (
                        <img src={league.brandingLogoUrl} alt={league.name} className="w-full h-full object-contain p-2" />
                    ) : (
                        <Shield className="w-8 h-8 text-[#00E676]" />
                    )}
                </div>
            </div>

            {/* ADS BANNER (DIAMANTE) */}
            {league.showAds && isEnterprise && ['diamante'].includes(packageType) && league.adImages && league.adImages.length > 0 && (
                <div className="w-full mb-4 animate-in fade-in zoom-in duration-700">
                    <div className="w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10 relative group">
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-widest backdrop-blur-sm z-10">
                            Publicidad
                        </div>
                        <img 
                            src={league.adImages[0]} 
                            alt="Publicidad" 
                            className="w-full h-auto object-cover max-h-[120px] sm:max-h-[160px]"
                        />
                    </div>
                </div>
            )}

            {/* SOCIAL MEDIA LINKS (Plata+ or Influencer+) */}
            {((isEnterprise && ['plata', 'oro', 'platino', 'diamante'].includes(packageType)) || (!isEnterprise && ['influencer', 'pro', 'elite', 'legend'].includes(packageType))) &&
            (league.socialInstagram || league.socialFacebook || league.socialTiktok || league.socialYoutube || league.socialWhatsapp || league.socialLinkedin || league.socialWebsite) && (
                <div className="flex flex-wrap justify-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    {league.socialInstagram && (
                        <a href={league.socialInstagram} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <Instagram size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                    {league.socialFacebook && (
                        <a href={league.socialFacebook} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <Facebook size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                    {league.socialTiktok && (
                        <a href={league.socialTiktok} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <Music2 size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                    {league.socialYoutube && (
                        <a href={league.socialYoutube} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <Youtube size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                    {league.socialWhatsapp && (
                        <a href={league.socialWhatsapp} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                    {league.socialLinkedin && (
                        <a href={league.socialLinkedin} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <Linkedin size={20} className="group-hover:scale-110 transition-transform" />
                        </a>
                    )}
                    {league.socialWebsite && (
                        <a href={league.socialWebsite} target="_blank" rel="noopener noreferrer" 
                           className="w-12 h-12 bg-[#0F172A] hover:bg-[#1E293B] rounded-full flex items-center justify-center text-slate-300 hover:text-white border border-slate-700 hover:border-white/20 transition-all shadow-md group">
                            <Globe size={20} className="group-hover:scale-110 transition-transform" />
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
