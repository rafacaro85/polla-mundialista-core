'use client';

import React from 'react';
import { 
  PlayCircle,
  Trophy,
  CalendarDays
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

import { EnterpriseRankingTable } from '@/modules/enterprise-league/components/EnterpriseRankingTable';
import { SocialFixture } from '@/modules/social-league/components/SocialFixture';

interface EnterpriseLeagueHomeProps {
    league?: any;
    participants?: any[];
    analytics?: any;
    matches?: any[];
    onEnterGame?: () => void;
}

export function EnterpriseLeagueHome({ league = {}, participants = [], matches = [], onEnterGame }: EnterpriseLeagueHomeProps) {
    const { user } = useAppStore();

    const coverUrl = league?.brandCoverUrl || process.env.NEXT_PUBLIC_COVER_URL || 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=2000';
    const logoUrl = league?.brandingLogoUrl || process.env.NEXT_PUBLIC_COMPANY_LOGO_URL;
    const companyName = league?.companyName || league?.name || process.env.NEXT_PUBLIC_COMPANY_NAME || 'EMPRESA';
    // primaryColor viene de --brand-primary (inyectado por LeagueThemeProvider), NO de process.env
    const welcomeMsg = league?.welcomeMessage || 'Únete a la emoción del fútbol corporativo. ¡Pronostica, compite y gana con tus compañeros!';

    return (
        <main className="w-full pb-8 space-y-8 animate-in fade-in duration-1000 px-4 md:px-8 max-w-7xl mx-auto pt-6">
            
            {/* 1. HERO - Banner, Logo, Nombre y Botón */}
            <div className="relative h-[400px] md:h-[500px] rounded-3xl overflow-hidden shadow-2xl group border border-white/5 mx-auto">
                <img 
                    src={coverUrl} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    alt="Hero Corporativo" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-bg,#0F172A)] via-[var(--brand-bg,#0F172A)]/80 to-transparent" />
                
                <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 flex flex-col items-start gap-4">
                    {logoUrl && (
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/20 mb-2">
                           <img src={logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                        </div>
                    )}
                    
                    <h2 className="text-4xl md:text-6xl font-black italic uppercase text-white leading-[0.9] tracking-tighter drop-shadow-lg">
                        ¡BIENVENIDO A LA <br /> 
                        <span style={{ color: 'var(--brand-primary, #00E676)' }}>POLLA {companyName}!</span>
                    </h2>
                    
                    <p className="text-slate-300 text-sm md:text-lg max-w-xl leading-relaxed drop-shadow-md font-medium">
                        {welcomeMsg}
                    </p>
                    
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                        <button
                            onClick={() => {
                                if (onEnterGame) onEnterGame();
                                else window.dispatchEvent(new CustomEvent('polla:navigate', { detail: 'predictions' }));
                            }}
                            className="px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-[0.2em] hover:scale-105 hover:translate-y-[-2px] active:scale-95 transition-all flex items-center gap-3"
                            style={{ backgroundColor: 'var(--brand-primary, #00E676)', color: 'var(--brand-bg, #0F172A)', boxShadow: '0 10px 40px rgba(var(--brand-primary-rgb, 0,230,118),0.3)' }}
                        >
                            <PlayCircle size={20} fill="currentColor" /> INGRESAR A JUGAR
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* 2. RANKING DE PARTICIPANTES */}
                <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <Trophy size={24} style={{ color: 'var(--brand-primary, #00E676)' }} />
                        <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Ranking</h3>
                    </div>
                    {/* Renderizamos solo el TOP 5 en el Home, el componente EnterpriseRankingTable busca su propia data de hecho */}
                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <EnterpriseRankingTable
                            leagueId={league?.id || process.env.NEXT_PUBLIC_LEAGUE_ID}
                            enableDepartmentWar={false}
                        />
                    </div>
                    
                    <button 
                         onClick={() => window.dispatchEvent(new CustomEvent('polla:navigate', { detail: 'ranking' }))}
                         className="mt-6 w-full py-3 text-center text-sm font-bold text-slate-400 hover:text-white border border-white/10 rounded-xl transition-colors hover:bg-white/5"
                    >
                         Ver Ranking Completo
                    </button>
                </div>

                {/* 3. PRÓXIMOS PARTIDOS */}
                <div className="bg-[#1E293B] border border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden">
                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                        <CalendarDays size={24} style={{ color: 'var(--brand-primary, #00E676)' }} />
                        <h3 className="text-xl font-black uppercase italic tracking-widest text-white">Próximos Partidos</h3>
                    </div>
                    <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        <SocialFixture
                            matchesData={matches}
                            loading={false}
                            onRefresh={() => {}}
                            isRefreshing={false}
                            leagueId={league?.id || process.env.NEXT_PUBLIC_LEAGUE_ID}
                        />
                    </div>
                </div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: rgba(255, 255, 255, 0.02);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
            `}} />
        </main>
    );
}
