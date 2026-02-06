'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Trophy, Users, Zap, Building2, CheckCircle, ArrowRight,
  Menu, X, Star, PlayCircle, ShieldCheck, Cpu, Smartphone,
  BarChart3, HelpCircle, ChevronDown, MessageCircle, Link as LinkIcon,
  Globe, Gift, Target, MousePointerClick, Shield, Crown, Gem
} from 'lucide-react';
import { signInWithGoogle } from '@/lib/auth.utils';

/* =============================================================================
   PALETA DE COLORES (USADA EN EL CÓDIGO)
   Obsidian: #0F172A
   Carbon:   #1E293B
   Signal:   #00E676
   Gold:     #FACC15
   Tactical: #94A3B8
   ============================================================================= */

// Rebuild trigger: Tailwind config updated

/* =============================================================================
   COMPONENTES UI (ELEMENTOS GRÁFICOS)
   ============================================================================= */

const LogoLight = () => (
  <div className="flex items-center gap-3 select-none">
    <img src="/icon-192x192.png" alt="La Polla Virtual" className="w-12 h-12 object-contain" />
    <div className="flex flex-col leading-none">
      <span className="font-black text-2xl text-slate-900 tracking-tighter">LA POLLA</span>
      <span className="font-black text-2xl text-[#00E676] tracking-tighter">VIRTUAL</span>
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

/* =============================================================================
   HOOK: LÓGICA DE TIEMPO
   ============================================================================= */
const useCountdown = (targetDate: number) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(interval);
      } else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
};

/* =============================================================================
   SUB-COMPONENTE: UNIDAD DE TIEMPO
   ============================================================================= */
const TimeUnit = ({ value, label, isSec }: { value: number, label: string, isSec?: boolean }) => (
  <div className="flex flex-col items-center mx-1 md:mx-2">
    <div className={`text-2xl md:text-4xl font-black text-white tracking-tighter tabular-nums ${isSec ? 'text-[#00E676] drop-shadow-[0_0_15px_rgba(0,230,118,0.5)]' : ''}`} style={{ fontFamily: '"Russo One", sans-serif' }}>
      {String(value).padStart(2, '0')}
    </div>
    <span className="text-[8px] md:text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{label}</span>
  </div>
);

/* =============================================================================
   COMPONENTE PRINCIPAL: THE STADIUM PULSE
   ============================================================================= */
const CountdownTimer = () => {
  // CONFIGURACIÓN: Fecha de inicio del Mundial 2026 (11 de Junio, 2026)
  // Usamos UTC para que sea exacto en todo el mundo sin depender de la hora local del usuario
  // Ajustado a las 16:00 UTC (Aproximadamente el partido inaugural)
  const targetDate = new Date(Date.UTC(2026, 5, 11, 16, 0, 0)).getTime();
  const time = useCountdown(targetDate);

  return (
    <div className="w-full max-w-lg mb-8 bg-[#0F172A] rounded-2xl p-6 border border-[#1E293B] shadow-2xl relative overflow-hidden group mx-auto lg:mx-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#1E293B] to-[#0F172A] opacity-80 pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#00E676] rounded-full opacity-5 animate-pulse blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="text-[#FACC15] animate-bounce" size={16} />
          <span className="text-[#00E676] font-bold uppercase tracking-[0.2em] text-[10px]">Kickoff 2026</span>
        </div>

        <div className="flex items-start justify-center gap-2 mb-0">
          <TimeUnit value={time.days} label="DÍAS" />
          <span className="text-xl font-black text-[#00E676] animate-pulse mt-1.5">:</span>
          <TimeUnit value={time.hours} label="HRS" />
          <span className="text-xl font-black text-[#00E676] animate-pulse mt-1.5">:</span>
          <TimeUnit value={time.minutes} label="MIN" />
          <span className="text-xl font-black text-[#00E676] animate-pulse mt-1.5">:</span>
          <TimeUnit value={time.seconds} label="SEG" isSec />
        </div>
      </div>
    </div>
  );
}

const PrimaryButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <button onClick={onClick} className="bg-[#00E676] text-[#0F172A] font-[900] uppercase tracking-widest px-8 py-4 rounded-xl shadow-lg shadow-green-500/20 hover:scale-105 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 text-sm z-20 relative">
    {children}
  </button>
);

const SecondaryButton = ({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
  <button onClick={onClick} className="bg-white border-2 border-[#94A3B8]/30 text-[#0F172A] font-bold uppercase tracking-widest px-8 py-4 rounded-xl hover:border-[#0F172A] hover:text-[#0F172A] transition-all duration-300 text-sm z-20 relative">
    {children}
  </button>
);

const FeatureCard = ({ icon, color, title, desc }: { icon: React.ReactNode, color: string, title: string, desc: string }) => (
  <div className="bg-white p-8 rounded-2xl border border-[#94A3B8]/20 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group h-full">
    <div className={`mb-6 w-14 h-14 rounded-xl flex items-center justify-center ${color} shadow-lg text-white group-hover:scale-110 transition-transform`}>{icon}</div>
    <h3 className="font-russo text-xl text-[#0F172A] mb-3">{title}</h3>
    <p className="text-[#94A3B8] text-sm leading-relaxed">{desc}</p>
  </div>
);

const ListItemSmall = ({ text, highlight = false, dark = false, dull = false, icon: Icon = CheckCircle }: { text: string, highlight?: boolean, dark?: boolean, dull?: boolean, icon?: any }) => {
  let iconColor = dark ? "text-[#00E676]" : "text-green-600";
  let textColor = dark ? "text-[#94A3B8]" : dull ? "text-[#94A3B8]/60" : "text-[#1E293B]";
  if (highlight) textColor = dark ? "text-white font-bold" : "text-[#0F172A] font-bold";
  if (dull) iconColor = "text-[#94A3B8]/60";

  return (
    <li className={`flex items-center gap-3 ${textColor} text-sm`}>
      <Icon size={14} className={iconColor} strokeWidth={3} />
      <span className={dull ? "line-through decoration-[#94A3B8]" : ""}>{text}</span>
    </li>
  )
};

const ScoreExample = ({ label, points }: { label: string, points: string }) => {
  return (
    <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-[#94A3B8]/20">
      <span className="text-sm font-bold text-[#1E293B]">{label}</span>
      <span className={`text-xs font-black px-3 py-1 rounded-full bg-[#94A3B8]/20 text-[#0F172A]`}>{points}</span>
    </div>
  );
};

const FAQItem = ({ question, answer }: { question: string, answer: string }) => {
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

const StepCard = ({ num, title, desc }: { num: string, title: string, desc: string }) => (
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

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();

  // DESHABILITADO: Auto-redirect interfiere con el flujo de onboarding empresarial
  // Los usuarios autenticados pueden ver la landing page
  // useEffect(() => {
  //   if (typeof window !== 'undefined') {
  //     const token = localStorage.getItem('token');
  //     const onboardingBusiness = localStorage.getItem('onboarding_business');
  //
  //     if (token) {
  //       if (onboardingBusiness === 'true') {
  //         localStorage.removeItem('onboarding_business');
  //         router.push('/business/new');
  //       } else {
  //         router.push('/dashboard');
  //       }
  //     }
  //   }
  // }, [router]);

  // LÓGICA DE NEGOCIO INTEGRADA
  const onLoginClick = () => {
    // Redirigir a la página de login donde el usuario puede elegir cómo ingresar
    window.location.href = '/login';
  };

  const handleCreateBusinessPool = () => {
    console.log('🏢 [BUSINESS] Iniciando creación de polla empresarial');

    if (typeof window !== 'undefined') {
      // Verificar si el usuario ya está autenticado
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');

      console.log('🏢 [BUSINESS] Token existente:', !!token);
      console.log('🏢 [BUSINESS] Usuario existente:', !!user);

      if (token && user) {
        // Usuario ya autenticado, redirigir directamente al formulario
        console.log('🏢 [BUSINESS] Usuario ya autenticado, redirigiendo a /business/new');
        window.location.href = '/business/new';
        return;
      }

      // Usuario no autenticado, establecer flag y hacer OAuth
      console.log('🏢 [BUSINESS] Estableciendo flag onboarding_business');
      localStorage.setItem('onboarding_business', 'true');
      const flagSet = localStorage.getItem('onboarding_business');
      console.log('🏢 [BUSINESS] Flag verificado:', flagSet);
    }

    // Para crear polla de empresa, ir directo a Google OAuth
    console.log('🏢 [BUSINESS] Redirigiendo a Google OAuth');
    signInWithGoogle();
  };

  return (
    <div className="w-full min-h-screen bg-white text-[#0F172A] font-sans selection:bg-[#00E676] selection:text-[#0F172A] overflow-x-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&display=swap');
        .font-russo { font-family: 'Russo One', sans-serif; }
      `}</style>

      {/* --- NAVBAR --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-[#94A3B8]/20">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <LogoLight />
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-[#94A3B8]">
            <a href="#como-se-juega" className="hover:text-[#00E676] transition-colors">Cómo Jugar</a>
            <a href="#comunidad" className="hover:text-[#00E676] transition-colors text-[#00E676]">Torneo Global</a>
            <Link href="/planes" className="hover:text-[#00E676] transition-colors">Planes</Link>
            <a href="#corporativo" className="hover:text-[#00E676] transition-colors">Empresas</a>
            <div className="w-px h-6 bg-[#94A3B8]/30 mx-2"></div>
            <button onClick={onLoginClick} className="bg-[#0F172A] text-white px-5 py-2 rounded-lg font-[900] uppercase text-xs hover:bg-[#1E293B] shadow-md transition-all">
              Ingresar / Crear Cuenta
            </button>
          </div>
          <button className="md:hidden text-[#0F172A]" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-[#94A3B8]/20 p-6 flex flex-col gap-4 shadow-xl absolute w-full animate-in slide-in-from-top-5 top-20 left-0 z-40">
            <a href="#como-se-juega" onClick={() => setIsMenuOpen(false)} className="text-[#0F172A] font-bold py-2">Cómo Jugar</a>
            <a href="#comunidad" onClick={() => setIsMenuOpen(false)} className="text-[#0F172A] font-bold py-2">Torneo Global</a>
            <Link href="/planes" onClick={() => setIsMenuOpen(false)} className="text-[#0F172A] font-bold py-2">Planes</Link>
            <a href="#corporativo" onClick={() => setIsMenuOpen(false)} className="text-[#0F172A] font-bold py-2">Empresas</a>
            <button
              onClick={() => { onLoginClick(); setIsMenuOpen(false); }}
              className="w-full bg-[#0F172A] text-white py-4 rounded-xl font-black uppercase"
            >
              Ingresar
            </button>
          </div>
        )}
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-slate-50">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-bl from-green-100 to-transparent rounded-full blur-[100px] opacity-60 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8 text-center lg:text-left">
            <CountdownTimer />
            <h1 className="font-russo text-5xl lg:text-7xl text-[#0F172A] leading-[0.95] tracking-tight">
              ORGANIZA LA <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E676] to-emerald-600">MEJOR POLLA</span>
              <br /> DE LA HISTORIA.
            </h1>
            <p className="text-[#94A3B8] text-lg lg:text-xl max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
              Olvida el Excel. IA integrada, ranking en tiempo real, muro social y pagos automatizados. La plataforma definitiva para empresas, amigos e influencers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <PrimaryButton onClick={onLoginClick}>
                Ingresar / Crear Polla <ArrowRight size={20} />
              </PrimaryButton>
            </div>
            <div className="flex items-center justify-center lg:justify-start gap-4 pt-4 text-sm text-[#94A3B8] font-medium">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#00E676]" /><span>Google OAuth</span></div>
              <div className="w-1 h-1 bg-[#94A3B8] rounded-full"></div>
              <div className="flex items-center gap-2"><Zap size={16} className="text-[#00E676]" /><span>Resultados en Vivo</span></div>
            </div>
          </div>
          <div className="relative mx-auto lg:mr-0 w-full max-w-sm flex justify-center">
            <div className="absolute top-10 left-10 w-full h-full bg-[#00E676] rounded-[3rem] blur-[60px] opacity-20"></div>
            {iPhoneMockup()}
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
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto relative">
            <div className="hidden lg:block absolute top-12 left-10 right-10 h-0.5 bg-[#94A3B8]/20 -z-10"></div>
            <StepCard num="1" title="Regístrate" desc="Crea tu cuenta gratis con Google en segundos. Sin formularios eternos." />
            <StepCard num="2" title="Crea tu Polla" desc="Organiza tu polla privada con amigos o compañeros de trabajo. Vive la fiebre mundialista de forma única." />
            <StepCard num="3" title="Pronostica" desc="Ingresa tus marcadores de la fase de grupos y arma tu Bracket final." />
            <StepCard num="4" title="Gana Puntos" desc="Suma puntos por aciertos y sube en el ranking global y privado." />
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
              <ScoreExample label="Marcador Exacto" points="+3 PTS" />
              <ScoreExample label="Acertar Ganador" points="+2 PTS" />
              <ScoreExample label="Goles Local (2)" points="+1 PT" />
              <ScoreExample label="Goles Visitante (1)" points="+1 PT" />
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
              <li className="flex items-start gap-3 text-[#1E293B] font-medium bg-blue-50 p-3 rounded-lg border border-blue-100 mt-2">
                <div className="bg-blue-200 p-1 rounded-full text-blue-700 mt-0.5"><Trophy size={16} strokeWidth={3} /></div>
                <div><strong className="text-[#0F172A] block">+10 Puntos: Preguntas Bonus</strong><span className="text-sm text-[#94A3B8]">Predicciones especiales extras (Campeón, Goleador, etc.) configuradas por el admin.</span></div>
              </li>
              <li className="flex items-start gap-3 text-[#1E293B] font-medium bg-purple-50 p-3 rounded-lg border border-purple-100 mt-2">
                <div className="bg-purple-200 p-1 rounded-full text-purple-700 mt-0.5"><Crown size={16} strokeWidth={3} /></div>
                <div><strong className="text-[#0F172A] block">+ Puntos: Simulador de Fases</strong><span className="text-sm text-[#94A3B8]">Suma puntos extra acertando los equipos clasificados en cada fase final.</span></div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* --- PLANES --- */}
      <section id="precios" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-russo text-3xl md:text-4xl text-[#0F172A] mb-4">PLANES PARA TODOS</h2>
            <p className="text-[#94A3B8]">Desde la familia hasta grandes corporaciones. Pago único por todo el mundial.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">

            {/* SOCIAL: FAMILIA */}
            <div className="border-2 border-emerald-100 bg-white rounded-2xl p-6 hover:shadow-xl hover:border-emerald-300 transition-all flex flex-col relative overflow-hidden group">
              <div className="mb-4 relative z-10">
                <h3 className="font-black text-lg text-emerald-600 flex items-center gap-2"><Shield size={18} /> FAMILIA</h3>
                <div className="text-3xl font-black text-[#0F172A] mt-2">GRATIS</div>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded mt-2 inline-block">Hasta 5 Jugadores</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1 relative z-10">
                <ListItemSmall text="Ranking Automático" />
                <ListItemSmall text="Predicciones con IA" />
                <ListItemSmall text="Preguntas Bonus" />
                <ListItemSmall text="Comodín (Joker)" />
              </ul>
              <button onClick={onLoginClick} className="w-full py-3 rounded-lg border-2 border-emerald-500 font-bold text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all text-sm relative z-10">Crear Gratis</button>
            </div>

            {/* SOCIAL: PARCHE */}
            <div className="border-2 border-orange-200 bg-orange-50/20 rounded-2xl p-6 hover:shadow-xl hover:border-orange-400 transition-all flex flex-col relative overflow-hidden group">
              <div className="absolute top-0 right-0 bg-orange-100 text-orange-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg z-20">POPULAR</div>
              <div className="mb-4 relative z-10">
                <h3 className="font-black text-lg text-orange-500 flex items-center gap-2"><Star size={18} /> PARCHE</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-[#0F172A]">$30k</span>
                  <span className="text-xs font-bold text-[#94A3B8]">COP</span>
                </div>
                <span className="text-xs font-bold text-orange-800 bg-orange-100 px-2 py-0.5 rounded mt-2 inline-block">Hasta 15 Jugadores</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1 relative z-10">
                <ListItemSmall text="Todo lo de Familia" highlight={true} />
                <ListItemSmall text="Foto del Premio" />
                <ListItemSmall text="Sin Publicidad" icon={Star} />
              </ul>
              <button onClick={onLoginClick} className="w-full py-3 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition-all text-sm relative z-10 shadow-lg shadow-orange-500/30">Seleccionar</button>
            </div>

            {/* ENTERPRISE: BRONCE */}
            <div className="border-2 border-slate-200 bg-white rounded-2xl p-6 hover:shadow-xl hover:border-slate-400 transition-all flex flex-col relative overflow-hidden group">
              <div className="mb-4">
                <h3 className="font-black text-lg text-slate-700 flex items-center gap-2"><Building2 size={18} /> BRONCE</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-slate-900">$100k</span>
                  <span className="text-xs font-bold text-slate-500">COP</span>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded mt-2 inline-block">25 Colaboradores</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                <ListItemSmall text="Branding Básico" />
                <ListItemSmall text="Logo Empresa" />
                <ListItemSmall text="Imagen Premio" />
              </ul>
              <Link href="/business/new" className="w-full py-3 rounded-lg bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all text-center text-sm">Seleccionar</Link>
            </div>

            {/* ENTERPRISE: DIAMANTE */}
            <div className="border-2 border-slate-700 bg-gradient-to-b from-[#1E293B] to-[#0F172A] rounded-2xl p-6 hover:shadow-xl hover:border-emerald-500 transition-all flex flex-col text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-500 text-[#0F172A] text-[10px] font-bold px-3 py-1 rounded-bl-lg">VIP</div>
              <div className="mb-4">
                <h3 className="font-black text-lg text-white flex items-center gap-2"><Gem size={18} className="text-emerald-400" /> DIAMANTE</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-3xl font-black text-white">$1M</span>
                  <span className="text-xs font-bold text-slate-500">COP</span>
                </div>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-400 px-2 py-0.5 rounded mt-2 inline-block">500 Colaboradores</span>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                <ListItemSmall text="Banners Promocionales Propios" dark={true} highlight={true} />
                <ListItemSmall text="Guerra de Áreas" dark={true} />
                <ListItemSmall text="Muro Social" dark={true} />
              </ul>
              <Link href="/business/new" className="w-full py-3 rounded-lg bg-emerald-500 text-[#0F172A] font-bold hover:bg-emerald-400 transition-all text-center text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]">Seleccionar</Link>
            </div>

          </div>

          <div className="flex justify-center">
            <Link href="/planes">
              <button className="bg-[#0F172A] text-white font-black text-lg px-10 py-4 rounded-xl shadow-xl hover:scale-105 transition-transform flex items-center gap-3">
                VER TODOS LOS PLANES Y PRECIOS <ArrowRight size={20} className="text-[#00E676]" />
              </button>
            </Link>
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
            {/* New Section: Employee Benefits */}
            <div className="mt-12 pt-12 border-t border-slate-100">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest mb-6">
                <Users size={12} /> Clima Laboral & Bienestar
              </div>
              <h3 className="font-russo text-2xl md:text-3xl text-[#0F172A] mb-4 leading-tight">
                INTEGRACIÓN <span className="text-emerald-500">TOTAL</span> DE ÁREAS
              </h3>
              <p className="text-[#94A3B8] text-lg mb-4 leading-relaxed">
                Rompe los silos de la oficina. Imagina a <strong>Contabilidad vs. Ventas</strong> o Sistemas vs. Recursos Humanos. Una competencia sana donde todos interactúan en igualdad de condiciones.
              </p>
              <p className="text-[#94A3B8] text-lg leading-relaxed">
                Incrementa la motivación con premios que importan: desde un <strong>día libre</strong> hasta un viaje soñado. Un equipo que se divierte unido, trabaja mejor unido.
              </p>
            </div>
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
            <FAQItem question="¿Qué es el Comodín (Joker)?" answer="Es una estrategia de juego que puedes usar una vez por fase. Al activarlo en tu predicción más segura, duplicará (x2) los puntos que obtengas en ese partido específico. ¡Úsalo sabiamente!" />
            <FAQItem question="¿Qué son las Preguntas Bonus?" answer="Son predicciones adicionales configuradas por el administrador de la polla (ej: ¿Quién será el Campeón? ¿Máximo Goleador?). Estas preguntas otorgan puntos extra al final del torneo." />
            <FAQItem question="¿Cómo funciona el Simulador de Bracket?" answer="Es una herramienta visual donde predices el camino de los clasificados desde Dieciseisavos de Final hasta la Gran Final. Acertar qué equipos avanzan de ronda te suma puntos adicionales." />
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
      <a href="https://wa.me/573045414087?text=Hola,%20me%20interesa%20la%20Polla%20Mundialista" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform z-50 flex items-center gap-2 group">
        <MessageCircle size={24} fill="white" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Chatea con Ventas</span>
      </a>
    </div>
  );
}
