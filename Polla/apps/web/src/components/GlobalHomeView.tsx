import React from 'react';
import { Trophy, Calendar, Users, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import PrizeCard from './PrizeCard';
// Assuming PrizeCard is suitable or we might need a PrizeHero. 
// User mentioned "Pestaña home tendrá un mensaje de bienvenida, estará publicada la imagen de los premios"
import { PrizeHero } from './PrizeHero'; // Using existing PrizeHero if available or mock it.

interface GlobalHomeViewProps {
    userName?: string;
    onNavigateToLeagues: () => void;
}

export const GlobalHomeView: React.FC<GlobalHomeViewProps> = ({ userName, onNavigateToLeagues }) => {
    return (
        <div className="flex flex-col space-y-6 pb-20">
            {/* Welcome Section */}
            <header className="text-center py-6 animate-in fade-in slide-in-from-top-4">
                <h1 className="text-3xl font-russo text-white mb-2">
                    HOLA, <span className="text-[var(--brand-primary,#00E676)]">{userName?.toUpperCase() || 'CRACK'}</span>
                </h1>
                <p className="text-slate-400 text-sm max-w-xs mx-auto">
                    Bienvenido a la Polla Mundialista 2026. ¡Predice, compite y gana grandes premios!
                </p>
            </header>

            {/* Prize Hero Section */}
            <div className="animate-in fade-in scale-95 duration-500 delay-100">
                <PrizeHero league={{
                    prizeImageUrl: 'https://images.unsplash.com/photo-1504609773096-104ff2c73ba4?auto=format&fit=crop&q=80&w=1000',
                    prizeDetails: 'Premios Exclusivos',
                    welcomeMessage: 'Participa en la polla global y gana increíbles recompensas.',
                    isEnterprise: false // Now allowed
                }} />
            </div>

            {/* Quick Actions / Info */}
            <div className="grid grid-cols-2 gap-4 px-2">
                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col items-center text-center gap-2 shadow-lg">
                    <div className="p-3 bg-blue-500/10 rounded-full text-blue-400">
                        <Users size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Gestionar Pollas</h3>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1">
                            Crea o únete a nuevos torneos
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-slate-600 hover:bg-slate-700 text-xs h-8"
                        onClick={onNavigateToLeagues}
                    >
                        Ir a Pollas
                    </Button>
                </div>

                <div className="bg-[#1E293B] p-4 rounded-xl border border-[#334155] flex flex-col items-center text-center gap-2 shadow-lg">
                    <div className="p-3 bg-[var(--brand-primary,#00E676)]/10 rounded-full text-[var(--brand-primary,#00E676)]">
                        <Trophy size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Ranking Global</h3>
                        <p className="text-[10px] text-slate-400 leading-tight mt-1">
                            Consulta tu posición mundial
                        </p>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full mt-2 border-slate-600 hover:bg-slate-700 text-xs h-8"
                        onClick={() => document.getElementById('tab-btn-ranking')?.click()} // Hacky navigation or pass handler
                    >
                        Ver Ranking
                    </Button>
                </div>
            </div>

            {/* Rules / Info Banner */}
            <div className="mx-2 p-4 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/30 relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-white font-bold mb-1 flex items-center gap-2">
                        <Calendar size={16} className="text-indigo-400" />
                        Próximos Partidos
                    </h3>
                    <p className="text-xs text-indigo-200 mb-3">
                        No olvides realizar tus predicciones antes de que inicien los juegos.
                    </p>
                    <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white border-none text-xs"
                        onClick={() => document.getElementById('tab-btn-game')?.click()}
                    >
                        Predecir Ahora <ArrowRight size={12} className="ml-1" />
                    </Button>
                </div>
                {/* Decoration */}
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl"></div>
            </div>

        </div>
    );
};
