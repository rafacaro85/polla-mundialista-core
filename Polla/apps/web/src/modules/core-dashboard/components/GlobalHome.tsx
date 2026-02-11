import React from 'react';
import Link from 'next/link';
import { Trophy, Calendar, Users, ArrowRight, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrizeCard from '@/components/PrizeCard';
import { PrizeHero } from '@/components/PrizeHero';
import { PromoBanner } from '@/components/PromoBanner';

import { useTournament } from '@/hooks/useTournament';

interface GlobalHomeProps {
    userName?: string;
    onNavigateToLeagues: () => void;
    onNavigateToBusiness: () => void;
    onNavigateToGames: () => void;
}

export const GlobalHome: React.FC<GlobalHomeProps> = ({ userName, onNavigateToLeagues, onNavigateToBusiness, onNavigateToGames }) => {
    const { tournamentId } = useTournament();
    const isUCL = tournamentId === 'UCL2526';

    return (
        <div className="flex flex-col space-y-6 pb-20">
            {/* Welcome Section */}
            <header className="text-center py-6 animate-in fade-in slide-in-from-top-4">
                <h1 className="text-3xl font-russo text-white mb-2">
                    HOLA, <span className="text-[var(--brand-primary,#00E676)]">{userName?.toUpperCase() || 'CRACK'}</span>
                </h1>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    {isUCL 
                      ? 'Bienvenido a la Polla Champions 25/26. ¡Predice, compite y diviértete!'
                      : 'Bienvenido a la Polla Mundialista 2026. ¡Predice, compite y gana grandes premios!'}
                </p>
            </header>


            {/* Prize Hero Section */}
            <div className="animate-in fade-in scale-95 duration-500 delay-100">
                <PrizeHero league={{
                    prizeImageUrl: '/images/wc2026_hero.png',
                    prizeDetails: 'Premios Exclusivos',
                    welcomeMessage: 'Participa en la polla global y gana increíbles recompensas.',
                    isEnterprise: false
                }} />
            </div>

            {/* Banner Promocional */}
            <PromoBanner
                onActionSocial={onNavigateToLeagues}
                onActionEnterprise={onNavigateToBusiness}
            />

            {/* Quick Actions / Info */}
            <div className="grid grid-cols-2 gap-4 px-2">
                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col items-center text-center gap-2 shadow-lg">
                    <div className="p-3 bg-emerald-500/10 rounded-full text-emerald-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Polla Social</h3>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1">
                            Crea una liga para tus amigos y familiares
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-slate-600 hover:bg-slate-700 text-xs h-8"
                        onClick={onNavigateToLeagues}
                    >
                        Gestionar Pollas
                    </Button>
                </div>

                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col items-center text-center gap-2 shadow-lg">
                    <div className="p-3 bg-amber-500/10 rounded-full text-amber-500">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Polla Empresarial</h3>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1">
                            Personalización total para tu empresa o marca
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-amber-600/30 hover:bg-amber-600/10 text-amber-500 text-xs h-8"
                        onClick={onNavigateToBusiness}
                    >
                        Gestionar Pollas
                    </Button>
                </div>
            </div>

            {/* Rules / Info Banner */}
            <button
                onClick={onNavigateToGames}
                className="mx-2 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/30 relative overflow-hidden text-left transition-all hover:scale-[1.02] active:scale-[0.98] group"
            >
                <div className="relative z-10">
                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                        <Calendar size={16} className="text-indigo-400" />
                        Próximos Partidos
                    </h3>
                    <p className="text-xs text-indigo-200 mb-3">
                        No olvides realizar tus predicciones antes de que inicien los juegos.
                    </p>
                    <div
                        className="inline-flex items-center justify-center rounded-md text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-none"
                    >
                        Predecir Ahora <ArrowRight size={12} className="ml-1" />
                    </div>
                </div>
                {/* Decoration */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl group-hover:bg-indigo-500/30 transition-colors"></div>
            </button>

        </div>
    );
};
