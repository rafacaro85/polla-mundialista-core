'use client';
import React, { useState } from 'react';
import {
    Trophy, Users, Zap, Building2, CheckCircle, ArrowRight,
    Menu, X, Star, PlayCircle, ShieldCheck, Cpu, Smartphone,
    BarChart3, HelpCircle, ChevronDown, MessageCircle, Link as LinkIcon,
    Globe, Gift, Target, MousePointerClick
} from 'lucide-react';

/* =============================================================================
   PALETA DE COLORES (REFERENCIA)
   Obsidian: #0F172A (Fondos oscuros, Textos Fuertes)
   Carbon:   #1E293B (Tarjetas oscuras, Elementos UI)
   Signal:   #00E676 (Acción principal, Éxito)
   Gold:     #FACC15 (Premium, Trofeos)
   Tactical: #94A3B8 (Textos secundarios, Bordes, Iconos inactivos)
   ============================================================================= */

/* =============================================================================
   COMPONENTES UI (ELEMENTOS GRÁFICOS)
   ============================================================================= */

const LogoLight = () => (
    <div className="flex items-center gap-3 select-none">
        <div className="relative w-9 h-9 flex items-center justify-center">
            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="8" className="w-full h-full text-[#00E676]">
                <circle cx="50" cy="50" r="45" />
                <path d="M50 20 L75 38 L65 68 L35 68 L25 38 Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M50 20 L50 5" strokeLinecap="round" /><path d="M75 38 L90 30" strokeLinecap="round" />
                <path d="M65 68 L80 85" strokeLinecap="round" /><path d="M35 68 L20 85" strokeLinecap="round" />
                <path d="M25 38 L10 30" strokeLinecap="round" />
            </svg>
        </div>
        <div className="flex flex-col leading-[0.85]">
            <span className="font-[900] text-[16px] text-[#0F172A] tracking-tighter font-sans">POLLA</span>
            <span className="font-[900] text-[20px] text-[#0F172A] tracking-tighter relative font-sans">
                MUNDIALISTA
                <span className="absolute -top-0.5 -right-1.5 w-1 h-1 bg-[#00E676] rounded-full"></span>
            </span>
            <span className="text-[9px] font-bold text-[#94A3B8] tracking-widest uppercase mt-0.5">FIFA World Cup 2026</span>
        </div>
    </div>
);

const MatchCardVisual = ({ className }: { className?: string }) => (
    <div className={`bg-[#1E293B] rounded-xl p-3 border border-[#94A3B8]/20 shadow-2xl relative overflow-hidden w-64 ${className}`}>
        <div className="text-center mb-2 text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">Gran Final • New Jersey</div>
        <div className="flex justify-between items-center mb-3 text-white">
            <div className="text-center"><span className="text-2xl font-black">BRA</span></div>
            <div className="text-xl font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded">3 - 1</div>
            <div className="text-center"><span className="text-2xl font-black">FRA</span></div>
        </div>
        <div className="w-full bg-[#00E676] text-[#0F172A] text-center py-1.5 rounded font-black text-[10px] uppercase flex items-center justify-center gap-1">
            <Star size={10} fill="currentColor" /> ¡ACERTASTE! +14 PTS
        </div>
    </div>
);

const RankingCardVisual = ({ className }: { className?: string }) => (
    <div className={`bg-white rounded-xl p-4 border border-[#94A3B8]/20 shadow-xl w-64 ${className}`}>
        <h3 className="font-bold text-xs mb-3 flex items-center gap-2 text-[#0F172A] uppercase tracking-wider"><Trophy size={12} className="text-[#FACC15]" /> Top Global</h3>
        {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 mb-2 p-2 border-b border-[#94A3B8]/10 last:border-0">
                <span className={`font-black w-4 text-center text-xs ${i === 1 ? 'text-[#FACC15]' : 'text-[#94A3B8]'}`}>{i}</span>
                <div className="w-6 h-6 rounded-full bg-[#94A3B8]/20"></div>
                <div className="flex-1">
                    <div className="h-1.5 w-16 bg-[#94A3B8]/20 rounded mb-1"></div>
                </div>
                <span className="font-bold text-xs text-[#0F172A]">{(5 - i) * 100}</span>
            </div>
        ))}
    </div>
);

const iPhoneMockup = () => (
    <div className="relative mx-auto w-[280px] h-[580px] bg-[#0F172A] rounded-[45px] border-[10px] border-[#1E293B] shadow-2xl overflow-hidden transform rotate-[-3deg] hover:rotate-0 transition-transform duration-500 group">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100px] h-[25px] bg-[#1E293B] rounded-b-[16px] z-20"></div>
        <div className="w-full h-full bg-[#0F172A] relative flex flex-col font-sans text-white pt-10 overflow-hidden">
            <div className="px-5 pb-4 flex justify-between items-center">
                <Menu size={18} className="text-[#94A3B8]" />
                <span className="font-black text-[#00E676] tracking-widest text-[10px]">EN VIVO • FWC26</span>
                <div className="w-7 h-7 rounded-full bg-[#1E293B] border border-[#94A3B8]/30"></div>
            </div>
            <div className="px-4 mb-4">
                <div className="bg-[#1E293B] rounded-xl p-3 border border-[#94A3B8]/20 shadow-lg relative overflow-hidden group-hover:scale-105 transition-transform">
                    <div className="text-center mb-2 text-[8px] font-bold text-[#94A3B8] uppercase tracking-widest">Octavos de Final</div>
                    <div className="flex justify-between items-center mb-3">
                        <div className="text-center"><span className="text-2xl font-black">ARG</span></div>
                        <div className="text-xl font-bold text-[#00E676] bg-[#00E676]/10 px-2 py-0.5 rounded">2 - 0</div>
                        <div className="text-center"><span className="text-2xl font-black">MEX</span></div>
                    </div>
                    <div className="w-full bg-[#00E676] text-[#0F172A] text-center py-1.5 rounded font-black text-[10px] uppercase flex items-center justify-center gap-1">
                        <Star size={10} fill="currentColor" /> JOKER ACTIVADO (x2)
                    </div>
                </div>
            </div>
            <div className="flex-1 bg-[#1E293B] rounded-t-[24px] p-5 relative mt-2">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-[#94A3B8]/20 rounded-full"></div>
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-white"><Trophy size={14} className="text-[#FACC15]" /> Ranking Global</h3>
                {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 mb-2 p-2 border-b border-[#94A3B8]/10">
                        <span className={`font-black w-4 text-center text-xs ${i === 1 ? 'text-[#FACC15]' : 'text-[#94A3B8]'}`}>{i}</span>
                        <div className="w-6 h-6 rounded-full bg-[#94A3B8]/20"></div>
                        <div className="flex-1">
                            <div className="h-1.5 w-16 bg-[#94A3B8]/20 rounded mb-1"></div>
                            <div className="h-1 w-10 bg-[#94A3B8]/10 rounded"></div>
                        </div>
                        <span className="font-bold text-xs text-white">{(5 - i) * 100}pts</span>
                    </div>
                ))}
            </div>
            <div className="h-14 bg-[#0F172A]/90 backdrop-blur border-t border-[#1E293B] absolute bottom-0 w-full flex justify-around items-center px-4">
                <div className="w-8 h-8 rounded-full bg-[#00E676] shadow-[0_0_10px_#00E676] flex items-center justify-center text-[#0F172A]"><PlayCircle size={16} fill="currentColor" /></div>
                <Trophy size={18} className="text-[#94A3B8]" />
                <BarChart3 size={18} className="text-[#94A3B8]" />
            </div>
        </div>
    </div>
);

const PrimaryButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick} className="bg-[#00E676] text-[#0F172A] font-[900] uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-green-500/20 hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm">
        {children}
    </button>
);

const SecondaryButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button onClick={onClick} className="bg-white border-2 border-[#94A3B8]/30 text-[#0F172A] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:border-[#0F172A] hover:text-[#0F172A] transition-all duration-300 text-sm">
        {children}
    </button>
);

const FeatureCard = ({ icon, color, title, desc }: any) => (
    <div className="bg-white p-8 rounded-2xl border border-[#94A3B8]/20 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group h-full">
        <div className={`mb-6 w-14 h-14 rounded-xl flex items-center justify-center ${color} shadow-lg text-white group-hover:scale-110 transition-transform`}>{icon}</div>
        <h3 className="font-russo text-xl text-[#0F172A] mb-3">{title}</h3>
        <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
    </div>
);

const ListItemSmall = ({ text, highlight = false, dark = false, dull = false, icon: IconComponent = CheckCircle }: any) => {
    let iconColor = dark ? "text-[#00E676]" : "text-green-600";
    let textColor = dark ? "text-[#94A3B8]" : dull ? "text-[#94A3B8]/60" : "text-[#1E293B]";
    if (highlight) textColor = "text-[#0F172A] font-bold";
    if (dull) iconColor = "text-[#94A3B8]/60";

    return (
        <li className={`flex items-center gap-3 ${textColor} text-sm`}>
            <IconComponent size={14} className={iconColor} strokeWidth={3} />
            <span className={dull ? "line-through decoration-[#94A3B8]" : ""}>{text}</span>
        </li>
    )
};

const ScoreExample = ({ label, points, type }: any) => {
    return (
        <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-[#94A3B8]/20">
            <span className="text-sm font-bold text-[#1E293B]">{label}</span>
            <span className={`text-xs font-black px-3 py-1 rounded-full bg-[#94A3B8]/20 text-[#0F172A]`}>{points}</span>
        </div>
    );
};

const FAQItem = ({ question, answer }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-[#94A3B8]/20 last:border-0">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full py-4 flex items-center justify-between text-left group">
                <span className={`font-bold text-sm ${isOpen ? 'text-[#00E676]' : 'text-[#1E293B]'} group-hover:text-[#00E676] transition-colors`}>{question}</span>
                <ChevronDown size={18} className={`text-[#94A3B8] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#00E676]' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                <p className="text-[#94A3B8] text-sm leading-relaxed pr-8">{answer}</p>
            </div>
        </div>
    );
};

const StepCard = ({ num, title, desc }: any) => (
    <div className="text-center p-6">
        <div className="w-12 h-12 rounded-full bg-white border-2 border-[#94A3B8]/20 text-[#0F172A] font-black text-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            {num}
        </div>
        <h3 className="font-russo text-lg text-[#0F172A] mb-2">{title}</h3>
        <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
    </div>
);

/* =============================================================================
   PÁGINA DE INICIO (LANDING PAGE)
   ============================================================================= */
export default function LandingPage({ onLoginClick }: { onLoginClick: () => void }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="min-h-screen bg-white text-[#0F172A] font-sans selection:bg-[#00E676] selection:text-[#0F172A]">
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&display=swap');
        .font-russo { font-family: 'Russo One', sans-serif; }
      `}</style>

            {/* --- NAVBAR --- */}
            <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-[#94A3B8]/20">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <LogoLight />
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#94A3B8]">
                        <a href="#como-se-juega" className="hover:text-[#00E676] transition-colors">Cómo Jugar</a>
                        <a href="#comunidad" className="hover:text-[#00E676] transition-colors text-[#00E676]">Torneo Global</a>
                        <a href="#precios" className="hover:text-[#00E676] transition-colors">Planes</a>
                        <a href="#corporativo" className="hover:text-[#00E676] transition-colors">Empresas</a>
                        <div className="w-px h-6 bg-[#94A3B8]/30 mx-2"></div>
                        <button onClick={onLoginClick} className="hover:text-[#0F172A] transition-colors">Ingresar</button>
                        <button onClick={onLoginClick} className="bg-[#0F172A] text-white px-5 py-2 rounded-lg font-[900] uppercase text-xs hover:bg-[#1E293B] shadow-md transition-all">
                            Crear Polla
                        </button>
                    </div>
                    <button className="md:hidden text-[#0F172A]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
                {isMenuOpen && (
                    <div className="md:hidden bg-white border-b border-[#94A3B8]/20 p-6 flex flex-col gap-4 shadow-xl absolute w-full animate-in slide-in-from-top-5">
                        <a href="#como-se-juega" className="text-[#0F172A] font-bold py-2">Cómo Jugar</a>
                        <a href="#precios" className="text-[#0F172A] font-bold py-2">Planes</a>
                        <a href="#corporativo" className="text-[#0F172A] font-bold py-2">Empresas</a>
                        <button onClick={onLoginClick} className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-black uppercase">Ingresar</button>
                    </div>
                )}
            </nav>

            {/* --- HERO SECTION --- */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green-100 to-transparent rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-[#94A3B8]/30 text-[#0F172A] text-[11px] font-bold uppercase tracking-widest shadow-sm">
                            <span className="w-2 h-2 rounded-full bg-[#00E676] animate-pulse"></span>
                            Fútbol Profesional
                        </div>
                        <h1 className="font-russo text-5xl lg:text-7xl text-[#0F172A] leading-[0.95] tracking-tight">
                            ORGANIZA LA <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-emerald-600">MEJOR POLLA</span>
                            <br /> DE LA HISTORIA.
                        </h1>
                        <p className="text-[#94A3B8] text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                            Olvida el Excel. IA integrada, ranking en tiempo real, muro social y pagos automatizados. La plataforma definitiva para empresas, amigos e influencers.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                            <PrimaryButton onClick={onLoginClick}>Empezar Gratis <ArrowRight size={20} /></PrimaryButton>
                            <SecondaryButton onClick={onLoginClick}>Ver Demo</SecondaryButton>
                        </div>
                        <div className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-[#94A3B8] font-medium">
                            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#00E676]" /><span>Google OAuth</span></div>
                            <div className="w-1 h-1 bg-[#94A3B8] rounded-full"></div>
                            <div className="flex items-center gap-2"><Zap size={16} className="text-[#00E676]" /><span>Resultados en Vivo</span></div>
                        </div>
                    </div>
                    <div className="relative mx-auto lg:mr-0 w-full max-w-sm flex justify-center">
                        <div className="absolute top-10 left-10 w-full h-full bg-[#00E676] rounded-[3rem] blur-[60px] opacity-20"></div>
                        <iPhoneMockup />
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN: TORNEO GLOBAL Y COMUNIDAD --- */}
            <section id="comunidad" className="py-20 bg-[#0F172A] text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute top-10 left-10 w-64 h-64 bg-[#1E293B] rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#00E676] rounded-full blur-[100px]"></div>
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="relative h-[400px] hidden lg:flex items-center justify-center">
                            <div className="absolute top-0 left-10 transform -rotate-6 animate-pulse hover:rotate-0 transition-transform duration-500 z-10">
                                <MatchCardVisual />
                            </div>
                            <div className="absolute bottom-0 right-10 transform rotate-6 hover:rotate-0 transition-transform duration-500 z-20">
                                <RankingCardVisual />
                            </div>
                            <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 absolute">
                                <Globe size={48} className="text-[#00E676] animate-spin-slow" />
                            </div>
                        </div>
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E676]/20 border border-[#00E676]/50 text-[#00E676] text-[10px] font-bold uppercase tracking-widest mb-6">
                                <Globe size={12} /> Comunidad Global
                            </div>
                            <h2 className="font-russo text-4xl lg:text-5xl mb-6 leading-tight">
                                COMPITE CONTRA <br /> <span className="text-[#00E676]">TODO EL MUNDO</span>
                            </h2>
                            <p className="text-[#94A3B8] text-lg mb-8 leading-relaxed">
                                Al registrarte, no solo juegas con tus amigos. Automáticamente participas en la <strong>Polla Global</strong> contra todos los usuarios de la plataforma.
                            </p>
                            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 flex items-center gap-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-[#FACC15] to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                                    <Gift size={32} className="text-white" />
                                </div>
                                <div>
                                    <h4 className="font-black text-xl mb-1 text-white">Premio Sorpresa al Ganador</h4>
                                    <p className="text-[#94A3B8] text-sm">El usuario con más puntos al finalizar el mundial se lleva un premio increíble cortesía de la plataforma.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- CÓMO JUGAR --- */}
            <section id="como-se-juega" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="font-russo text-3xl md:text-4xl text-[#0F172A] mb-4">¿CÓMO JUGAR?</h2>
                        <p className="text-[#94A3B8]">Es tan fácil que hasta tu abuela querrá participar.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto relative">
                        {/* Connector line for desktop */}
                        <div className="hidden md:block absolute top-12 left-20 right-20 h-0.5 bg-[#94A3B8]/20 -z-10"></div>
                        <StepCard num="1" title="Regístrate" desc="Crea tu cuenta gratis con Google en segundos. Sin formularios eternos." />
                        <StepCard num="2" title="Pronostica" desc="Ingresa tus marcadores de la fase de grupos y arma tu Bracket final." />
                        <StepCard num="3" title="Gana Puntos" desc="Suma puntos por aciertos y sube en el ranking global y privado." />
                    </div>
                </div>
            </section>

            {/* --- FUNCIONALIDADES --- */}
            <section className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="font-russo text-3xl md:text-4xl text-[#0F172A] mb-4">MÁS QUE UNA APP, UN MOTOR DE JUEGO</h2>
                        <p className="text-[#94A3B8] text-lg">Tecnología Mobile First diseñada para escalar de 10 a 100.000 usuarios.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={<Cpu className="text-white" size={28} />} color="bg-purple-600" title="IA con Gemini" desc="Disponible en Plan Líder+. Nuestra IA analiza estadísticas históricas y te sugiere resultados probables automáticamente." />
                        <FeatureCard icon={<Star className="text-white" size={28} />} color="bg-[#FACC15]" title="Modo Joker (x2)" desc="Estrategia pura. Activa un comodín por fase y duplica tus puntos. Ideal para remontar en la tabla." />
                        <FeatureCard icon={<Zap className="text-white" size={28} />} color="bg-[#00E676]" title="Ranking en Vivo" desc="Conexión API directa. La tabla de posiciones se actualiza segundos después del pitazo final." />
                        <FeatureCard icon={<Smartphone className="text-white" size={28} />} color="bg-blue-500" title="Mobile First" desc="Sin descargas. Funciona como app nativa en iOS y Android. Diseño responsivo y veloz." />
                        <FeatureCard icon={<Users className="text-white" size={28} />} color="bg-pink-500" title="Muro Social" desc="Trash-talk amigable, reacciones y comentarios en tiempo real. Crea comunidad. (Plan Líder y Empresas)." />
                        <FeatureCard icon={<CheckCircle className="text-white" size={28} />} color="bg-[#1E293B]" title="Simulador Bracket" desc="Predice las fases finales completas: Dieciseisavos, Octavos, Cuartos, Semi, Final y Campeón." />
                        <FeatureCard icon={<LinkIcon className="text-white" size={28} />} color="bg-teal-500" title="Enlaces Mágicos" desc="Invita con un clic. Genera un link único de WhatsApp y los usuarios se unen sin códigos complejos." />
                    </div>
                </div>
            </section>

            {/* --- SISTEMA DE PUNTOS DETALLADO --- */}
            <section className="py-24 bg-white border-y border-[#94A3B8]/20">
                <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#94A3B8]/20 relative">
                        <div className="absolute top-4 right-4 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase">Partido Real: 2 - 1</div>
                        <div className="text-center mb-6 pb-6 border-b border-[#94A3B8]/20">
                            <p className="text-[#94A3B8] text-xs font-bold uppercase tracking-widest mb-2">Tu Predicción</p>
                            <div className="flex justify-center items-center gap-6">
                                <span className="text-3xl font-black text-[#0F172A]">LOC</span>
                                <span className="text-4xl font-black text-[#00E676]">2-1</span>
                                <span className="text-3xl font-black text-[#0F172A]">VIS</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <ScoreExample label="Marcador Exacto" points="+3 PTS" type="win" />
                            <ScoreExample label="Acertar Ganador" points="+2 PTS" type="win" />
                            <ScoreExample label="Goles Local (2)" points="+1 PT" type="win" />
                            <ScoreExample label="Goles Visitante (1)" points="+1 PT" type="win" />
                            <div className="pt-2 border-t border-[#94A3B8]/20 mt-2">
                                <div className="flex justify-between items-center p-3 rounded-lg bg-[#0F172A] text-white">
                                    <span className="text-sm font-bold flex items-center gap-2"><Star size={14} className="text-[#FACC15]" /> TOTAL (Máximo)</span>
                                    <span className="text-lg font-black text-[#00E676]">7 PTS</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="font-russo text-3xl md:text-4xl text-[#0F172A] mb-6">SISTEMA DE PUNTOS JUSTO</h2>
                        <p className="text-[#94A3B8] mb-8 text-lg leading-relaxed">Un sistema acumulativo diseñado para premiar el conocimiento pero mantener a todos en el juego hasta el final.</p>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-[#1E293B] font-medium bg-green-50 p-3 rounded-lg border border-green-100">
                                <div className="bg-green-200 p-1 rounded-full text-green-700 mt-0.5"><CheckCircle size={16} strokeWidth={3} /></div>
                                <div><strong className="text-[#0F172A] block">3 Puntos: Marcador Exacto</strong><span className="text-sm text-[#94A3B8]">Acertaste el resultado perfecto (ej: 2-1).</span></div>
                            </li>
                            <li className="flex items-start gap-3 text-[#1E293B] font-medium p-2">
                                <div className="bg-[#94A3B8]/20 p-1 rounded-full text-[#94A3B8] mt-0.5"><MousePointerClick size={16} strokeWidth={3} /></div>
                                <div><strong className="text-[#0F172A] block">2 Puntos: Ganador o Empate</strong><span className="text-sm text-[#94A3B8]">Acertaste quién ganaba, aunque fallaste el marcador.</span></div>
                            </li>
                            <li className="flex items-start gap-3 text-[#1E293B] font-medium p-2">
                                <div className="bg-[#94A3B8]/20 p-1 rounded-full text-[#94A3B8] mt-0.5"><Target size={16} strokeWidth={3} /></div>
                                <div><strong className="text-[#0F172A] block">+1 Punto por Goles</strong><span className="text-sm text-[#94A3B8]">1 punto extra por acertar goles del local y 1 por visitante.</span></div>
                            </li>
                            <li className="flex items-start gap-3 text-[#1E293B] font-medium bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                <div className="bg-yellow-200 p-1 rounded-full text-yellow-700 mt-0.5"><Star size={16} fill="currentColor" /></div>
                                <div><strong className="text-[#0F172A] block">Factor Comodín (Joker)</strong><span className="text-sm text-[#94A3B8]">Duplica tus puntos (x2) en tu partido más seguro de la fecha.</span></div>
                            </li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- PLANES --- */}
            <section id="precios" className="py-24 bg-slate-50">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="font-russo text-3xl md:text-4xl text-[#0F172A] mb-4">PLANES PARA TODOS</h2>
                        <p className="text-[#94A3B8]">Desde la familia hasta grandes corporaciones. Pago único por todo el mundial.</p>
                    </div>
                    <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                        {/* Plan Amigos */}
                        <div className="border border-[#94A3B8]/20 bg-white rounded-2xl p-8 hover:shadow-xl transition-all">
                            <h3 className="font-black text-xl text-[#94A3B8] mb-2">AMIGOS</h3>
                            <div className="text-4xl font-black text-[#0F172A] mb-6">GRATIS</div>
                            <p className="text-sm text-[#94A3B8] mb-6 border-b border-[#94A3B8]/20 pb-6">Para familias y grupos pequeños.</p>
                            <ul className="space-y-3 mb-8">
                                <ListItemSmall text="Hasta 5 Usuarios" />
                                <ListItemSmall text="Ranking Automático" />
                                <ListItemSmall text="Predicciones Manuales" />
                                <ListItemSmall text="Resultados por IA" dull={true} icon={X} />
                                <ListItemSmall text="Muro de Comentarios" dull={true} icon={X} />
                                <ListItemSmall text="Publicidad Incluida" dull={true} />
                            </ul>
                            <button onClick={onLoginClick} className="w-full py-3 rounded-lg border-2 border-[#0F172A] font-bold text-[#0F172A] hover:bg-[#0F172A] hover:text-white transition-all">Crear Gratis</button>
                        </div>
                        {/* Plan Lider */}
                        <div className="border-2 border-[#00E676] bg-white rounded-2xl p-8 relative shadow-2xl transform lg:-translate-y-4">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#00E676] text-[#0F172A] font-black text-xs px-3 py-1 rounded-full uppercase tracking-widest">Más Popular</div>
                            <h3 className="font-black text-xl text-[#00E676] mb-2">LÍDER</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-[#0F172A]">$50k</span>
                                <span className="text-sm font-bold text-[#94A3B8]">COP / 20 Cupos</span>
                            </div>
                            <p className="text-sm text-[#94A3B8] mb-6 border-b border-[#94A3B8]/20 pb-6">Ideal para emprendedores, compañeros de universidad o influencers.</p>
                            <ul className="space-y-3 mb-8">
                                <ListItemSmall text="Hasta 100 Cupos (Escalable)" highlight={true} />
                                <ListItemSmall text="Generación de Resultados con IA" highlight={true} icon={Cpu} />
                                <ListItemSmall text="Muro Social Activo" highlight={true} icon={MessageCircle} />
                                <ListItemSmall text="Gestión de Pagos (Semáforo)" />
                                <ListItemSmall text="Sin Publicidad Externa" />
                            </ul>
                            <button onClick={onLoginClick} className="w-full py-3 rounded-lg bg-[#00E676] font-black text-[#0F172A] shadow-lg shadow-green-500/20 hover:scale-105 transition-all">Seleccionar Plan</button>
                        </div>
                        {/* Plan Corporativo */}
                        <div className="border border-[#94A3B8]/20 rounded-2xl p-8 hover:border-[#94A3B8] transition-all bg-[#0F172A] text-white">
                            <h3 className="font-black text-xl text-white mb-2">CORPORATIVO</h3>
                            <div className="flex items-baseline gap-1 mb-6">
                                <span className="text-4xl font-black text-white">$900k</span>
                                <span className="text-sm font-bold text-[#94A3B8]">COP / 100 Emp</span>
                            </div>
                            <p className="text-sm text-[#94A3B8] mb-6 border-b border-[#1E293B] pb-6">Solución Enterprise para Clima Laboral y Marketing.</p>
                            <ul className="space-y-3 mb-8">
                                <ListItemSmall text="Branding Total (Marca Blanca)" dark={true} />
                                <ListItemSmall text="Guerra de Áreas (RRHH)" dark={true} />
                                <ListItemSmall text="Fidelización de Clientes (B2B/B2C)" dark={true} />
                                <ListItemSmall text="Dashboard de Analítica" dark={true} />
                            </ul>
                            <button onClick={onLoginClick} className="w-full py-3 rounded-lg bg-white font-black text-[#0F172A] hover:bg-[#94A3B8] transition-all">Cotizar Empresa</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- SECCIÓN FIDELIZACIÓN --- */}
            <section id="corporativo" className="py-24 bg-white relative overflow-hidden border-t border-[#94A3B8]/20">
                <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
                    <div className="order-2 md:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest mb-6">
                            <Target size={12} /> Marketing y Branding
                        </div>
                        <h2 className="font-russo text-3xl md:text-5xl text-[#0F172A] mb-6 leading-tight">
                            FIDELIZACIÓN Y <br /><span className="text-blue-600">BRAND AWARENESS</span>
                        </h2>
                        <p className="text-[#94A3B8] text-lg mb-6 leading-relaxed">
                            <strong>Convierte la pasión del fútbol en una herramienta de marketing poderosa.</strong> No te limites a tus empleados; crea ligas exclusivas para tus clientes donde los premios sean tus propios productos o servicios.
                        </p>
                        <p className="text-[#94A3B8] text-lg mb-8 leading-relaxed">
                            Garantiza una <strong>exposición de marca diaria</strong> y recurrente durante todo el torneo. Tu logo y tus colores estarán en el bolsillo de tu cliente cada vez que revise el ranking, fortaleciendo el <em>Top of Mind</em> de forma orgánica y divertida.
                        </p>
                        <button className="text-blue-600 font-black uppercase tracking-widest text-sm flex items-center gap-2 hover:gap-4 transition-all">
                            Ver Estrategias de Marketing <ArrowRight size={16} />
                        </button>
                    </div>
                    <div className="order-1 md:order-2 bg-slate-50 rounded-3xl p-8 border border-[#94A3B8]/20 relative">
                        <div className="absolute -top-6 -right-6 bg-[#00E676] text-[#0F172A] font-black text-xs px-4 py-2 rounded-lg transform rotate-6 shadow-lg">
                            ¡Tu Marca Aquí!
                        </div>
                        <div className="space-y-4 opacity-80">
                            <div className="h-4 bg-[#94A3B8]/30 rounded w-3/4"></div>
                            <div className="h-32 bg-[#94A3B8]/30 rounded w-full"></div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="h-20 bg-[#94A3B8]/30 rounded"></div>
                                <div className="h-20 bg-[#94A3B8]/30 rounded"></div>
                                <div className="h-20 bg-[#94A3B8]/30 rounded"></div>
                            </div>
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Building2 size={64} className="text-[#94A3B8]" />
                        </div>
                    </div>
                </div>
            </section>

            {/* --- PREGUNTAS FRECUENTES (FAQ) --- */}
            <section className="py-24 bg-slate-50 border-t border-[#94A3B8]/20">
                <div className="max-w-3xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <HelpCircle size={40} className="mx-auto text-[#94A3B8] mb-4" />
                        <h2 className="font-russo text-3xl md:text-4xl text-[#0F172A] mb-4">PREGUNTAS FRECUENTES</h2>
                        <p className="text-[#94A3B8]">Resolvemos tus dudas técnicas sobre la plataforma.</p>
                    </div>
                    <div className="space-y-2">
                        <FAQItem question="¿Qué es la 'Cuchara de Palo'?" answer="Es un reconocimiento divertido (icono de cuchara) que aparece en la tabla de posiciones junto al usuario que va en último lugar. Fomenta la competencia sana y las risas en el grupo." />
                        <FAQItem question="¿Cómo funciona el pago en el Plan Líder?" answer="El organizador (Líder) paga el paquete de cupos a la plataforma. Luego, él cobra la inscripción a sus participantes. La app incluye un 'Semáforo de Deudores' para gestionar quién ya pagó." />
                        <FAQItem question="¿Qué pasa si hay empate en el primer lugar?" answer="La plataforma utiliza la 'Pregunta de Oro' (Total de goles del mundial) configurada por el admin como criterio de desempate automático." />
                        <FAQItem question="¿Es seguro ingresar con mi cuenta?" answer="Totalmente. Usamos OAuth 2.0 de Google. No almacenamos contraseñas. Además, el sistema de 'Bloqueo Anti-Fraude' valida la hora atómica para evitar cambios en pronósticos una vez iniciado el partido." />
                    </div>
                </div>
            </section>

            {/* --- FOOTER --- */}
            <footer className="bg-white pt-20 pb-10 border-t border-[#94A3B8]/20">
                <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-4 gap-12 mb-16">
                    <div className="col-span-1 md:col-span-2">
                        <LogoLight />
                        <p className="text-[#94A3B8] mt-6 text-sm max-w-xs leading-relaxed">La plataforma oficial para tu Polla Mundialista 2026. Infraestructura Serverless segura, escalable y confiable.</p>
                        <div className="flex gap-4 mt-6">
                            <div className="bg-slate-100 p-2 rounded flex items-center gap-2 text-xs font-bold text-[#1E293B]"><ShieldCheck size={14} /> Anti-Fraude</div>
                            <div className="bg-slate-100 p-2 rounded flex items-center gap-2 text-xs font-bold text-[#1E293B]"><Cpu size={14} /> IA Gemini Powered</div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[#0F172A] font-black mb-6 uppercase text-xs tracking-widest">Producto</h4>
                        <ul className="space-y-3 text-sm text-[#94A3B8] font-medium">
                            <li><a href="#" className="hover:text-[#00E676]">Características</a></li>
                            <li><a href="#" className="hover:text-[#00E676]">Precios</a></li>
                            <li><a href="#" className="hover:text-[#00E676]">Para Empresas</a></li>
                            <li><a href="#" className="hover:text-[#00E676]">API & Datos</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-[#0F172A] font-black mb-6 uppercase text-xs tracking-widest">Legal</h4>
                        <ul className="space-y-3 text-sm text-[#94A3B8] font-medium">
                            <li><a href="#" className="hover:text-[#00E676]">Términos de Uso</a></li>
                            <li><a href="#" className="hover:text-[#00E676]">Privacidad de Datos</a></li>
                            <li><a href="#" className="hover:text-[#00E676]">Soporte</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-[#94A3B8]/20 text-center text-[#94A3B8] text-xs font-medium">© 2026 Polla Mundialista. Todos los derechos reservados.</div>
            </footer>

            {/* --- WHATSAPP FLOATING BUTTON --- */}
            <a href="#" className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50 flex items-center gap-2 group">
                <MessageCircle size={24} fill="white" />
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Chatea con Ventas</span>
            </a>
        </div>
    );
}
