import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, Briefcase, Zap, HeartHandshake, ArrowRight, TrendingUp, Medal, Trophy, Star } from 'lucide-react';

interface PromoBannerProps {
    onActionSocial?: () => void;
    onActionEnterprise?: () => void;
}

const PROMO_CARDS = [
    {
        id: 1,
        type: 'social',
        icon: Users,
        title: "¿EL GRUPO DE WHATSAPP EXPLOTA?",
        body: "¡Lleva la recocha al siguiente nivel! Crea una Polla para más de 50 panas y vive la emoción sin límites.",
        cta: "CREAR POLLA SOCIAL",
        gradient: "from-emerald-600/20 to-teal-900/60",
        border: "border-emerald-500/30",
        textAcc: "text-emerald-400",
        decor: <Star className="absolute -right-4 -top-4 text-emerald-500/10 w-24 h-24 rotate-12" />
    },
    {
        id: 3,
        type: 'company',
        icon: TrendingUp,
        title: "¿EQUIPO DESMOTIVADO?",
        body: "¡Rompe la rutina! Una Polla Corporativa une áreas, sube la moral y crea un ambiente inolvidable.",
        cta: "POLLA EMPRESARIAL",
        gradient: "from-amber-600/20 to-orange-900/60",
        border: "border-amber-500/30",
        textAcc: "text-amber-400",
        decor: <Briefcase className="absolute -right-4 -bottom-4 text-amber-500/10 w-24 h-24 -rotate-12" />
    },
    {
        id: 2,
        type: 'social',
        icon: Zap,
        title: "NO SOLO VEAS EL FÚTBOL...",
        body: "¡Juégalo! Organiza la Polla de tu barrio o universidad y demuestra quién es el que más sabe.",
        cta: "CREAR MI POLLA",
        gradient: "from-blue-600/20 to-indigo-900/60",
        border: "border-blue-500/30",
        textAcc: "text-blue-400",
        decor: <Trophy className="absolute -right-2 -top-2 text-blue-500/10 w-20 h-20 rotate-6" />
    },
    {
        id: 4,
        type: 'company',
        icon: HeartHandshake,
        title: "FIDELIZA CON PASIÓN",
        body: "Regala una experiencia única. Una Polla exclusiva para tus clientes con premios increíbles.",
        cta: "POLLA PARA CLIENTES",
        gradient: "from-violet-600/20 to-purple-900/60",
        border: "border-violet-500/30",
        textAcc: "text-violet-400",
        decor: <Medal className="absolute -right-4 -bottom-4 text-violet-500/10 w-24 h-24 -rotate-6" />
    }
];

export const PromoBanner: React.FC<PromoBannerProps> = ({ onActionSocial, onActionEnterprise }) => {

    // Default handlers if not provided (fallback)
    const handleSocial = () => {
        if (onActionSocial) onActionSocial();
        else console.log("Navigate to Social");
    };

    const handleEnterprise = () => {
        if (onActionEnterprise) onActionEnterprise();
        else console.log("Navigate to Enterprise");
    };

    return (
        <div className="w-full overflow-hidden py-8 bg-slate-900/30 border-y border-white/5 relative group select-none">
            {/* Gradient Side Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-8 z-20 bg-gradient-to-r from-[#0F172A] to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 z-20 bg-gradient-to-l from-[#0F172A] to-transparent pointer-events-none" />

            <div className="flex w-max animate-scroll group-hover:pause-animation group-active:pause-animation touch-none">
                {/* Double the list for infinite scroll effect */}
                {[...PROMO_CARDS, ...PROMO_CARDS].map((card, index) => (
                    <div
                        key={`${card.id}-${index}`}
                        className={`w-[280px] md:w-[320px] flex-shrink-0 mx-4 rounded-3xl p-6 border ${card.border} bg-gradient-to-br ${card.gradient} relative overflow-hidden transition-transform duration-300 hover:scale-[1.02] shadow-xl`}
                    >
                        {/* Background Decor */}
                        {card.decor}

                        <div className="relative z-10 flex flex-col h-full justify-between gap-4">
                            <div>
                                <div className={`w-12 h-12 rounded-2xl bg-slate-950/40 backdrop-blur-sm flex items-center justify-center mb-4 ${card.textAcc} border border-white/10 shadow-inner`}>
                                    <card.icon size={24} strokeWidth={2.5} />
                                </div>
                                <h3 className="font-russo uppercase text-white text-base tracking-wide leading-tight mb-2 drop-shadow-md">
                                    {card.title}
                                </h3>
                                <p className="text-slate-200 text-xs font-medium leading-relaxed drop-shadow-sm">
                                    {card.body}
                                </p>
                            </div>

                            <Button
                                className={`w-full text-xs font-black uppercase tracking-widest ${card.textAcc === 'text-amber-400' ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' :
                                        card.textAcc === 'text-violet-400' ? 'bg-violet-600 hover:bg-violet-500 text-white' :
                                            card.textAcc === 'text-blue-400' ? 'bg-blue-600 hover:bg-blue-500 text-white' :
                                                'bg-emerald-500 hover:bg-emerald-400 text-slate-950'} border-none shadow-lg transition-transform active:scale-95`}
                                size="sm"
                                onClick={card.type === 'social' ? handleSocial : handleEnterprise}
                            >
                                {card.cta} <ArrowRight size={14} className="ml-2" />
                            </Button>

                        </div>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes scroll {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-scroll {
                    animation: scroll 60s linear infinite;
                }
                .pause-animation {
                    animation-play-state: paused;
                }
                /* Mobile touch pause - using active state and explicit class for hover */
                .group:active .animate-scroll,
                .group:hover .animate-scroll {
                    animation-play-state: paused;
                }
            `}</style>
        </div>
    );
};
