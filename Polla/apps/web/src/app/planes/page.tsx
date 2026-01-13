'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
    Shield, Star, Zap, Trophy, Crown, CheckCircle, X,
    Building2, Briefcase, Medal, Gem, ArrowRight,
    Menu, ChevronDown, Users, MessageCircle, Share2, Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/* =============================================================================
   COMPONENTS
   ============================================================================= */

const LogoLight = () => (
    <div className="flex items-center gap-3 select-none">
        <div className="flex flex-col leading-tight">
            <span className="font-black text-xl text-slate-900">POLLA</span>
            <span className="font-black text-2xl text-slate-900">
                MUNDIALISTA
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">FIFA World Cup 2026</span>
        </div>
    </div>
);

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    return (
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link href="/">
                    <LogoLight />
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-8 text-sm font-bold text-slate-400">
                    <Link href="/#como-se-juega" className="hover:text-emerald-500 transition-colors">Cómo Jugar</Link>
                    <Link href="/planes" className="text-emerald-500 transition-colors">Planes</Link>
                    <Link href="/login" className="bg-slate-900 text-white px-5 py-2 rounded-lg font-black uppercase text-xs hover:bg-slate-800 shadow-md transition-all">
                        Ingresar
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-slate-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? <X /> : <Menu />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-white border-b border-slate-200 p-6 flex flex-col gap-4 shadow-xl absolute w-full animate-in slide-in-from-top-5 top-20 left-0 z-40">
                    <Link href="/" onClick={() => setIsMenuOpen(false)} className="text-slate-900 font-bold py-2">Inicio</Link>
                    <Link href="/#como-se-juega" onClick={() => setIsMenuOpen(false)} className="text-slate-900 font-bold py-2">Cómo Jugar</Link>
                    <Link href="/planes" onClick={() => setIsMenuOpen(false)} className="text-slate-900 font-bold py-2">Planes</Link>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-center">
                        Ingresar
                    </Link>
                </div>
            )}
        </nav>
    );
};

const ListItem = ({ text, highlight = false, dark = false, dull = false, icon: Icon = CheckCircle }: any) => {
    let iconColor = dark ? "text-emerald-400" : "text-emerald-600";
    let textColor = dark ? "text-slate-400" : dull ? "text-slate-400/60" : "text-slate-700";
    if (highlight) textColor = dark ? "text-white font-bold" : "text-slate-900 font-bold";
    if (dull) iconColor = "text-slate-300";

    return (
        <li className={`flex items-start gap-3 ${textColor} text-sm`}>
            <Icon size={16} className={`${iconColor} mt-0.5 shrink-0`} strokeWidth={2.5} />
            <span className={dull ? "line-through decoration-slate-300" : ""}>{text}</span>
        </li>
    )
};

const PlanCard = ({ plan, isEnterprise = false }: { plan: any, isEnterprise?: boolean }) => {
    // Theme Colors - Using stronger colors and gradients for better visibility
    const getThemeClasses = (theme: string) => {
        if (isEnterprise) return 'border-slate-700 bg-slate-900 text-white'; // Base enterprise
        switch (theme) {
            case 'orange': return 'border-orange-300 bg-gradient-to-br from-orange-100 via-orange-50 to-white hover:border-orange-500 hover:shadow-orange-200/50';
            case 'emerald': return 'border-emerald-300 bg-gradient-to-br from-emerald-100 via-emerald-50 to-white hover:border-emerald-500 hover:shadow-emerald-200/50';
            case 'blue': return 'border-blue-300 bg-gradient-to-br from-blue-100 via-blue-50 to-white hover:border-blue-500 hover:shadow-blue-200/50';
            case 'indigo': return 'border-indigo-300 bg-gradient-to-br from-indigo-100 via-indigo-50 to-white hover:border-indigo-500 hover:shadow-indigo-200/50';
            case 'violet': return 'border-violet-300 bg-gradient-to-br from-violet-100 via-violet-50 to-white hover:border-violet-500 hover:shadow-violet-200/50';
            case 'gold': return 'border-yellow-300 bg-gradient-to-br from-yellow-100 via-yellow-50 to-white hover:border-yellow-500 hover:shadow-yellow-200/50';
            default: return 'border-slate-200 bg-white';
        }
    };

    const cardClasses = getThemeClasses(plan.theme);

    // Decorative massive icon color
    const getDecoIconClass = (theme: string) => {
        if (isEnterprise) return 'text-slate-800';
        switch (theme) {
            case 'orange': return 'text-orange-200/50';
            case 'emerald': return 'text-emerald-200/50';
            case 'blue': return 'text-blue-200/50';
            case 'indigo': return 'text-indigo-200/50';
            case 'violet': return 'text-violet-200/50';
            default: return 'text-slate-100';
        }
    };

    return (
        <div
            className={`relative w-full rounded-3xl p-8 transition-all duration-300 border-2 flex flex-col overflow-hidden
            ${cardClasses}
            ${plan.highlight ? 'shadow-xl scale-105 z-10' : 'shadow-lg hover:-translate-y-2'}
            `}
        >
            {/* Decorative Background Shape */}
            <div className={`absolute -right-10 -top-10 transform rotate-12 ${getDecoIconClass(plan.theme)} pointer-events-none transition-transform group-hover:scale-110`}>
                {React.isValidElement(plan.icon) && React.cloneElement(plan.icon as React.ReactElement<any>, { size: 180, strokeWidth: 1.5, className: 'opacity-40' })}
            </div>

            {plan.tag && (
                <div className={`absolute top-0 right-8 -translate-y-1/2 font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-widest shadow-lg z-20
                    ${isEnterprise ? 'bg-emerald-500 text-slate-900' : 'bg-slate-900 text-white'}`}>
                    {plan.tag}
                </div>
            )}

            <div className="flex justify-between items-start mb-6 relative z-10">
                <div>
                    <h3 className={`font-black text-xl uppercase tracking-wide ${isEnterprise ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isEnterprise ? 'text-slate-400' : 'text-slate-500'}`}>{plan.subtitle}</p>
                </div>
                {/* Icon Box */}
                <div className={`p-3 rounded-2xl shadow-sm border ${isEnterprise ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-white/80 backdrop-blur text-slate-800 border-white/50'}`}>
                    {plan.icon}
                </div>
            </div>

            <div className="mb-6 relative z-10">
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl font-black ${isEnterprise ? 'text-white' : 'text-slate-900'}`}>{plan.price}</span>
                    {plan.price !== 'GRATIS' && <span className={`text-xs font-bold ${isEnterprise ? 'text-slate-500' : 'text-slate-400'}`}>COP</span>}
                </div>
                {plan.price_note && <p className="text-[10px] text-slate-500 font-medium mt-1">{plan.price_note}</p>}
            </div>

            <div className={`text-sm font-bold mb-6 px-4 py-2 rounded-lg inline-flex items-center gap-2 w-full relative z-10
                ${isEnterprise ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white/80 backdrop-blur text-slate-900 border border-white/50'}`}>
                <Users size={16} className={isEnterprise ? "text-emerald-400" : "text-emerald-600"} />
                {plan.capacity}
            </div>

            <p className={`text-sm mb-8 pb-6 border-b min-h-[60px] leading-relaxed relative z-10
                ${isEnterprise ? 'text-slate-400 border-slate-700' : 'text-slate-600 border-slate-900/10'}`}>
                {plan.desc}
            </p>

            <ul className="space-y-3 mb-8 flex-1 relative z-10">
                {plan.features.map((feature: any, i: number) => (
                    <ListItem key={i} text={feature.text} dull={feature.dull} dark={isEnterprise} icon={feature.icon} highlight={feature.highlight} />
                ))}
            </ul>

            <Link href={isEnterprise ? "/business/new" : "/login"} className="relative z-10">
                <Button
                    className={`w-full py-6 rounded-xl font-black uppercase tracking-widest transition-all
                    ${isEnterprise
                            ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
                            : plan.highlight
                                ? 'bg-slate-900 hover:bg-emerald-600 hover:text-white text-white shadow-xl'
                                : 'bg-white border-2 border-slate-200 text-slate-900 hover:border-emerald-500 hover:text-emerald-600 shadow-sm'
                        }`}
                >
                    {isEnterprise ? 'Seleccionar' : 'Elegir Plan'}
                </Button>
            </Link>
        </div>
    );
}

/* =============================================================================
   DATA
   ============================================================================= */

const SOCIAL_PLANS = [
    {
        name: 'FAMILIA',
        subtitle: 'Para jugar en casa',
        price: 'GRATIS',
        capacity: 'Hasta 5 Jugadores',
        desc: 'Para la familia pequeña. Vive la emoción del mundial y compite sanamente.',
        icon: <Shield size={24} className="text-emerald-500" />,
        theme: 'emerald',
        features: [
            { text: 'Ranking Automático' },
            { text: 'Predicciones por IA' },
            { text: 'Texto del Premio' },
            { text: 'Preguntas Bonus' },
            { text: 'Comodín (Joker)' },
            { text: 'Botón de Desempate' },
            { text: 'Soporte por WhatsApp' },
            { text: 'Contiene Publicidad', dull: true, icon: Zap } // Zap just as a random icon for ads? Or keep default
        ]
    },
    {
        name: 'PARCHE',
        subtitle: 'Amigos y Oficina',
        price: '$30.000',
        capacity: 'Hasta 15 Jugadores',
        desc: 'Ideal para grupos de amigos, la oficina o el grupo de fútbol.',
        icon: <Star size={24} className="text-orange-500" />,
        theme: 'orange',
        features: [
            { text: 'Todo lo del plan Familia' },
            { text: 'Foto del Premio', highlight: true },
            { text: 'Sin Publicidad', highlight: true, icon: Star }
        ]
    },
    {
        name: 'AMIGOS',
        subtitle: 'El más popular',
        price: '$80.000',
        capacity: 'Hasta 50 Jugadores',
        desc: 'Para grupos medianos, salones de clase o pequeños torneos.',
        tag: 'RECOMENDADO',
        highlight: true,
        icon: <Zap size={24} className="text-blue-500" />,
        theme: 'blue',
        features: [
            { text: 'Todo lo del plan Parche' },
            { text: 'Logo de la Polla', highlight: true }
        ]
    },
    {
        name: 'LÍDER',
        subtitle: 'Comunidades',
        price: '$180.000',
        capacity: 'Hasta 100 Jugadores',
        desc: 'Gestiona tu comunidad con herramientas de interacción social avanzadas.',
        icon: <MessageCircle size={24} className="text-indigo-500" />,
        theme: 'indigo',
        features: [
            { text: 'Todo lo del plan Amigos' },
            { text: 'Muro Social (Chat)', highlight: true, icon: MessageCircle },
        ]
    },
    {
        name: 'INFLUENCER',
        subtitle: 'Masivo',
        price: '$350.000',
        capacity: 'Hasta 200 Jugadores',
        desc: 'Máximo alcance. Personaliza tu presencia y redirige a tus redes.',
        icon: <Share2 size={24} className="text-violet-500" />,
        theme: 'violet',
        features: [
            { text: 'Todo lo del plan Líder' },
            { text: 'Botones Redes Sociales', highlight: true, icon: Share2 },
        ]
    }
];

const ENTERPRISE_PLANS = [
    {
        name: 'BRONCE',
        subtitle: 'Startups & PYMES',
        price: '$100.000',
        price_note: 'Pago único',
        capacity: 'Hasta 25 Jugadores',
        desc: 'Entrada al mundo corporativo con branding básico.',
        icon: <Building2 size={24} />,
        features: [
            { text: 'Personalización Colores Marca', highlight: true },
            { text: 'Logo de la Empresa', highlight: true },
            { text: 'Imagen del Premio' },
            { text: 'Texto del Premio' },
            { text: 'Ranking Automático' },
            { text: 'Predicciones por IA' },
            { text: 'Preguntas Bonus' },
            { text: 'Comodín (Joker)' },
            { text: 'Botón de Desempate' },
            { text: 'Soporte por WhatsApp' },
        ]
    },
    {
        name: 'PLATA',
        subtitle: 'Empresas en Crecimiento',
        price: '$175.000',
        capacity: 'Hasta 50 Jugadores',
        desc: 'Fomenta el trabajo en equipo y la visibilidad de marca.',
        icon: <Briefcase size={24} />,
        features: [
            { text: 'Todo lo del plan Bronce' },
            { text: 'Redes Sociales Corporativas', highlight: true },
        ]
    },
    {
        name: 'ORO',
        subtitle: 'Mediana Empresa',
        price: '$450.000',
        capacity: 'Hasta 150 Jugadores',
        desc: 'Integración completa con herramientas sociales.',
        highlight: true,
        tag: 'BEST SELLER',
        icon: <Medal size={24} />,
        features: [
            { text: 'Todo lo del plan Plata' },
            { text: 'Muro Social Interno', highlight: true },
        ]
    },
    {
        name: 'PLATINO',
        subtitle: 'Grandes Compañías',
        price: '$750.000',
        capacity: 'Hasta 300 Jugadores',
        desc: 'Competencia entre áreas para maximizar el engagement.',
        icon: <Trophy size={24} />,
        features: [
            { text: 'Todo lo del plan Oro' },
            { text: 'Guerra de Áreas (RRHH)', highlight: true },
        ]
    },
    {
        name: 'DIAMANTE',
        subtitle: 'Corporaciones',
        price: '$1.000.000',
        capacity: 'Hasta 500 Jugadores',
        desc: 'La experiencia definitiva con máxima visibilidad.',
        icon: <Gem size={24} />,
        features: [
            { text: 'Todo lo del plan Platino' },
            { text: 'Banners Publicidad (Home)', highlight: true, icon: Layout },
        ]
    }
];

export default function PlansPage() {
    const [activeTab, setActiveTab] = useState<'social' | 'enterprise'>('social');

    return (
        <div className="min-h-screen bg-slate-50 font-sans selection:bg-emerald-500 selection:text-white pb-20">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&display=swap');
                .font-russo { font-family: 'Russo One', sans-serif; }
            `}</style>

            <Navbar />

            <div className="pt-32 pb-16 px-6 text-center bg-[#0F172A] text-white">
                <div className="max-w-4xl mx-auto">
                    <h1 className="font-russo text-4xl md:text-6xl mb-6">ELIGE TU JUGADA MAESTRA</h1>
                    <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                        Ya sea para parchar con amigos o integrar a toda tu compañía, tenemos un plan diseñado para ti.
                    </p>

                    <div className="inline-flex p-1 bg-slate-800 rounded-full border border-slate-700">
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'social' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Polla Social
                        </button>
                        <button
                            onClick={() => setActiveTab('enterprise')}
                            className={`px-8 py-3 rounded-full text-sm font-black uppercase tracking-widest transition-all ${activeTab === 'enterprise' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            Polla Empresarial
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-8">
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 justify-center">
                    {activeTab === 'social' ? (
                        SOCIAL_PLANS.map((plan, i) => <PlanCard key={i} plan={plan} />)
                    ) : (
                        ENTERPRISE_PLANS.map((plan, i) => <PlanCard key={i} plan={plan} isEnterprise />)
                    )}
                </div>
            </div>

            <div className="max-w-3xl mx-auto mt-20 text-center px-6">
                <p className="text-slate-400 text-sm mb-4">¿Tienes dudas sobre qué plan elegir?</p>
                <Link href="https://wa.me/573000000000" className="text-emerald-600 font-bold hover:underline">
                    Chatea con un asesor en WhatsApp
                </Link>
            </div>

        </div>
    );
}
