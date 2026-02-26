'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { 
  Trophy, 
  Users, 
  PlayCircle, 
  ArrowRight, 
  Shield, 
  Swords, 
  Medal, 
  TrendingUp, 
  Clock,
  Crown,
  ChevronRight,
  ExternalLink,
  LogOut,
  Settings,
  User as UserIcon,
  Facebook,
  Instagram,
  Youtube,
  Globe,
  Linkedin,
  MessageCircle
} from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store/useAppStore';
import { UserStatusBlock } from '@/components/UserStatusBlock';
import { MoneyCard } from '@/components/MoneyCard';
import { Progress } from '@/components/ui/progress';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface EnterpriseLeagueHomeProps {
    league: any;
    participants: any[];
    analytics?: any;
    matches: any[];
}

const getPlanIncludesAreaWar = (packageType?: string) => {
    if (!packageType) return false;
    const t = packageType.toUpperCase();
    if (t === 'ENTERPRISE_BRONZE' || t === 'BRONZE' || t === 'STARTER' || t === 'BASIC') return false;
    return true;
};

const PLACEHOLDER_BANNERS = [
    { title: 'Publica aquí\ntu anuncio', description: 'Comunica novedades, promociones o mensajes importantes a tus colaboradores.', tag: 'ESPACIO DISPONIBLE', imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=1200' },
    { title: 'Impulsa tu\nMarca', description: 'Utiliza este espacio para reforzar la cultura organizacional de tu empresa.', tag: 'PUBLICIDAD', imageUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?q=80&w=1200' },
    { title: 'Premios\nExclusivos', description: 'Recuerda a los participantes los increíbles beneficios de liderar el ranking.', tag: 'MOTIVACIÓN', imageUrl: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?q=80&w=1200' }
];

/* =============================================================================
   BLOQUE C: CARTELERA (SLIDER)
   ============================================================================= */
const CarteleraSlider = ({ banners, showAds }: { banners: any[], showAds?: boolean }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000, stopOnInteraction: false })]);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const displayBanners = useMemo(() => {
        if (banners && banners.length > 0) return banners;
        return PLACEHOLDER_BANNERS;
    }, [banners]);

    useEffect(() => {
        if (!emblaApi) return;
        emblaApi.on('select', () => {
            setSelectedIndex(emblaApi.selectedScrollSnap());
        });
    }, [emblaApi]);

    if (showAds === false && (banners && banners.length === 0)) return null;

    return (
        <div className="relative w-full h-[350px] md:h-[300px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes instaprogress {
                    from { width: 0%; }
                    to { width: 100%; }
                }
            `}} />

            {/* Progress Bars (Instagram Style) */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1.5 p-4">
                {displayBanners.map((_, idx) => (
                    <div key={idx} className="h-[3px] flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                            key={`${idx}-${selectedIndex}`}
                            className="h-full bg-[var(--brand-bars,#00E676)]"
                            style={{
                                width: idx < selectedIndex ? '100%' : '0%',
                                animation: selectedIndex === idx ? 'instaprogress 5s linear forwards' : 'none'
                            }}
                        />
                    </div>
                ))}
            </div>

            <div className="overflow-hidden h-full" ref={emblaRef}>
                <div className="flex h-full">
                    {displayBanners.map((banner, index) => (
                        <div key={banner.id || index} className="flex-[0_0_100%] relative h-full">
                            <img
                              src={banner.imageUrl}
                              alt={banner.title}
                              className="w-full h-full object-cover object-center"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-bg,#0F172A)] via-[var(--brand-bg,#0F172A)]/20 to-transparent" />

                            <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col items-start gap-2">
                                {banner.tag && (
                                    <span className="bg-[var(--brand-primary,#00E676)] text-[var(--brand-bg,#0F172A)] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                        {banner.tag}
                                    </span>
                                )}
                                <h3 className="text-2xl md:text-4xl font-black uppercase leading-[0.85] italic drop-shadow-2xl">
                                    {banner.title?.split('\n')[0]} <br />
                                    <span className="text-[var(--brand-primary,#00E676)]">{banner.title?.split('\n')[1] || ''}</span>
                                </h3>
                                <p className="text-slate-200 text-xs md:text-base max-w-lg line-clamp-2 mt-2 font-medium drop-shadow-lg">
                                    {banner.description}
                                </p>
                                {banner.buttonText && (
                                    <button
                                        onClick={() => banner.buttonUrl && window.open(banner.buttonUrl, '_blank')}
                                        className="mt-4 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-white/10"
                                    >
                                        {banner.buttonText} <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PLACEHOLDER_PRIZES = [
    { badge: '1ER PUESTO', name: 'Gran Botín', type: 'cash', amount: 1000000 },
    { badge: '2DO PUESTO', name: 'Celular de Alta Gama', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600' },
    { badge: '3ER PUESTO', name: 'Kit de Bienvenida', type: 'image', imageUrl: 'https://images.unsplash.com/photo-1549443591-325b9d5a7304?q=80&w=600' }
];

/* =============================================================================
   BLOQUE D: PREMIOS (CARRUSEL)
   ============================================================================= */
const PrizesCarousel = ({ prizes }: { prizes: any[] }) => {
    const displayPrizes = useMemo(() => {
        if (prizes && prizes.length > 0) return prizes;
        return PLACEHOLDER_PRIZES;
    }, [prizes]);

    return (
        <div className="w-full max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-6 px-1">
                <Medal size={20} className="text-[var(--brand-primary,#00E676)]" />
                <h3 className="text-base font-black uppercase tracking-[0.2em] italic text-[var(--brand-heading,#FFFFFF)]">
                    Premios en disputa
                </h3>
            </div>

            {/* Contenedor Padre (Regla 1) */}
            <div className="w-full max-w-full overflow-hidden">
                {/* Scroll Interno (Regla 2) */}
                <div
                    className="flex overflow-x-auto gap-6 md:gap-10 px-6 md:px-2 py-6 mb-4 snap-x snap-mandatory no-scrollbar"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        scrollPaddingLeft: '1.5rem'
                    }}
                >
                    {displayPrizes.map((prize, idx) => (
                        <div
                            key={prize.id || idx}
                            className="flex-shrink-0 w-[320px] md:w-[380px] snap-center md:snap-start"
                        >
                            <div className="bg-[var(--brand-secondary,#1E293B)] border-2 border-white/5 rounded-[2rem] overflow-hidden relative shadow-2xl group hover:border-[var(--brand-primary)]/40 hover:translate-y-[-4px] transition-all duration-500">
                                {/* Badge de Posición */}
                                <div className="absolute top-4 left-4 z-10 bg-[var(--brand-primary,#00E676)] text-[var(--brand-bg,#0F172A)] text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg uppercase tracking-tight">
                                    {prize.badge || `${idx + 1}º PUESTO`}
                                </div>

                                {prize.type === 'image' ? (
                                    <div className="h-60 relative">
                                        <img src={prize.imageUrl} alt={prize.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
                                        <div className="absolute bottom-6 left-6">
                                            <p className="text-white font-black uppercase italic text-2xl tracking-tighter leading-none">{prize.name}</p>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em] mt-2">Gana por ranking</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-60 flex items-center justify-center bg-[#0F172A] p-2">
                                        <MoneyCard
                                            amount={Number(prize.amount)}
                                            variant="full"
                                            label=""
                                            topLabel={prize.topLabel}
                                            bottomLabel={prize.bottomLabel}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Ocultamos scrollbar con estilo local */}
            <style dangerouslySetInnerHTML={{ __html: `
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
            `}} />
        </div>
    );
};

/* =============================================================================
   BLOQUE F: GUERRA DE ÁREAS
   ============================================================================= */
const GuerraDeAreas = ({ analytics, leagueId }: { analytics: any, leagueId: string }) => {
    const router = useRouter();
    const ranking = analytics?.departmentRanking || [];

    return (
        <div className="bg-[var(--brand-secondary,#1E293B)] border border-white/10 rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Swords size={20} className="text-red-500" />
                    <h3 className="text-sm font-black uppercase tracking-widest text-[var(--brand-heading,#FFFFFF)] italic">Guerra de Áreas</h3>
                </div>
                <Users size={16} className="text-slate-500" />
            </div>

            <div className="space-y-6">
                {ranking.slice(0, 3).map((dept: any, idx: number) => {
                    const maxPoints = ranking[0]?.avgPoints || 100;
                    const progress = (dept.avgPoints / maxPoints) * 100;

                    return (
                        <div key={dept.department} className="space-y-2">
                            <div className="flex justify-between items-end">
                                <div className="flex items-center gap-2">
                                    <span className={`text-xl font-black italic ${idx === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>
                                        {idx + 1}º
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-white uppercase truncate max-w-[120px]">{dept.department}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{dept.members} Participantes</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-[var(--brand-primary,#00E676)]">{Math.round(dept.avgPoints)}</p>
                                    <p className="text-[8px] text-slate-500 font-bold">PTS AVG</p>
                                </div>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-[var(--brand-bars,#00E676)] rounded-full transition-all duration-1000"
                                    style={{
                                        width: `${progress}%`,
                                        opacity: idx === 0 ? 1 : 0.4
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}

                {ranking.length === 0 && (
                    <div className="text-center py-8 opacity-40 italic text-xs text-slate-500">
                        La competencia aún no ha comenzado
                    </div>
                )}
            </div>

            <button
                onClick={() => router.push(`/leagues/${leagueId}/ranking?tab=departments`)}
                className="w-full mt-6 py-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all flex items-center justify-center gap-2"
            >
                Ver Ranking Áreas <ArrowRight size={12} />
            </button>
        </div>
    );
};

/* =============================================================================
   COMPONENTE PRINCIPAL
   ============================================================================= */
export function EnterpriseLeagueHome({ league, participants, analytics, matches }: EnterpriseLeagueHomeProps) {
    const router = useRouter();
    const { user, logout } = useAppStore();
    const [showMenu, setShowMenu] = useState(false);

    // Check if user has admin/management rights (simpler check for the landing)
    const canManageLeague = league.isAdmin || user?.role === 'SUPER_ADMIN' || league.creatorId === user?.id;

    // Find my participant data
    const myParticipant = participants.find(p => p.userId === user?.id || p.id === user?.id);
    const myDepartment = myParticipant?.department || 'General';
    const nickname = (user?.nickname || user?.fullName?.split(' ')[0] || 'CRACK').toUpperCase();

    const banners = league.banners || [];
    const prizes = league.prizes || [];
    const showAreaWar = getPlanIncludesAreaWar(league.packageType);

    return (
        <>
            <main className="w-full pb-8 space-y-8 animate-in fade-in duration-1000">

                {/* FILA 1: HERO (2/3) + TU ESTADO (1/3) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* BLOQUE B: HERO */}
                    <div className="lg:col-span-2 relative h-[500px] rounded-3xl overflow-hidden shadow-2xl group border border-white/5">
                        <img 
                            src={league.brandCoverUrl || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000'} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                            alt="Hero" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-bg,#0F172A)] via-[var(--brand-bg,#0F172A)]/60 to-transparent" />
                        
                        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 flex flex-col items-start gap-4">
                            <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-[0.9] tracking-tighter">
                                ¡BIENVENIDO A LA <br /> 
                                <span className="text-[var(--brand-primary,#00E676)]">POLLA {league.companyName || league.name}!</span>
                            </h2>
                            <p className="text-slate-300 text-sm md:text-lg max-w-lg leading-relaxed">
                                {league.welcomeMessage || 'Únete a la emoción del fútbol corporativo. ¡Pronostica, compite y gana premios exclusivos con tus compañeros de equipo!'}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => router.push(`/leagues/${league.id}/predictions`)}
                                    className="bg-[var(--brand-primary,#00E676)] text-[var(--brand-bg,#0F172A)] px-10 py-5 rounded-2xl text-sm font-black uppercase tracking-[0.2em] shadow-[0_10px_40px_rgba(0,230,118,0.3)] hover:scale-105 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center gap-3"
                                >
                                    <PlayCircle size={20} fill="currentColor" /> INGRESAR A JUGAR
                                </button>

                                {/* Redes Sociales Corporativas */}
                                <div className="flex items-center gap-2">
                                    {league.socialInstagram && (
                                        <a href={league.socialInstagram} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="Instagram">
                                            <Instagram size={18} />
                                        </a>
                                    )}
                                    {league.socialFacebook && (
                                        <a href={league.socialFacebook} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="Facebook">
                                            <Facebook size={18} />
                                        </a>
                                    )}
                                    {league.socialWhatsapp && (
                                        <a href={`https://wa.me/${league.socialWhatsapp.replace(/\D/g, '')}`} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="WhatsApp">
                                            <MessageCircle size={18} />
                                        </a>
                                    )}
                                    {league.socialLinkedin && (
                                        <a href={league.socialLinkedin} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="LinkedIn">
                                            <Linkedin size={18} />
                                        </a>
                                    )}
                                    {league.socialYoutube && (
                                        <a href={league.socialYoutube} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="YouTube">
                                            <Youtube size={18} />
                                        </a>
                                    )}
                                    {league.socialTiktok && (
                                        <a href={league.socialTiktok} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="TikTok">
                                            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
                                            </svg>
                                        </a>
                                    )}
                                    {league.socialWebsite && (
                                        <a href={league.socialWebsite} target="_blank" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-all border border-white/10 shadow-xl" title="Sitio Web">
                                            <Globe size={18} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BLOQUE E: TU ESTADO (SIDEBAR MODE) */}
                    <div className="lg:col-span-1">
                        <ErrorBoundary>
                            <UserStatusBlock 
                                currentLeagueId={league.id}
                                matches={matches}
                                variant="side"
                                onNavigate={(tab) => {
                                     if (tab === 'predictions') router.push(`/leagues/${league.id}/predictions`);
                                     else if (tab === 'ranking') router.push(`/leagues/${league.id}/ranking`);
                                }}
                            />
                        </ErrorBoundary>
                    </div>
                </div>

                {/* BLOQUE C: CARTELERA (AJUSTE DE ALTURA) */}
                {league.packageType?.toUpperCase() !== 'ENTERPRISE_BRONZE' && league.packageType?.toUpperCase() !== 'BRONZE' && (
                    <div className="w-full h-[350px] md:h-[300px]">
                        <CarteleraSlider banners={banners} showAds={league.showAds} />
                    </div>
                )}

                {/* FILA 2: PREMIOS (ANCHO COMPLETO) */}
                <div className="w-full">
                    <PrizesCarousel prizes={prizes} />
                </div>

                {/* FILA 3: GUERRA DE ÁREAS (DEBAJO DE PREMIOS) */}
                <div className="w-full max-w-2xl mx-auto">
                    {showAreaWar && (
                        <ErrorBoundary>
                            <GuerraDeAreas analytics={analytics} leagueId={league.id} />
                        </ErrorBoundary>
                    )}
                    {!showAreaWar && (
                         <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                            <Swords size={32} className="text-slate-500" />
                            <div>
                                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Guerra de Áreas</p>
                                <p className="text-[10px] text-slate-500 font-bold max-w-[150px] mt-1">Disponible en planes Silver en adelante</p>
                            </div>
                         </div>
                    )}
                </div>

            </main>
        </>
    );
}
