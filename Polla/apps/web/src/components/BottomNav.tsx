import React from 'react';
import { Calendar, Trophy, Activity, Star, Users, Home } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus';
    onTabChange: (tab: 'home' | 'game' | 'leagues' | 'ranking' | 'bracket' | 'bonus') => void;
    showLeaguesTab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, showLeaguesTab = true }) => {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 w-full bg-[#0F172A]/95 backdrop-blur-xl border-t border-[#1E293B] z-[9999] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, paddingBottom: 'calc(env(safe-area-inset-bottom) + 16px)', paddingTop: '16px' }}
        >
            <div className="max-w-md mx-auto flex justify-around items-center">

                {/* 0. INICIO */}
                <button
                    onClick={() => onTabChange('home')}
                    className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 bg-transparent border-none outline-none p-0 ${activeTab === 'home' ? 'text-[#00E676] -translate-y-1' : 'text-[#94A3B8] hover:text-white'}`}
                >
                    {activeTab === 'home' && <div className="absolute -top-4 w-10 h-1 bg-[#00E676] rounded-b-full shadow-[0_0_10px_#00E676]"></div>}
                    <Home size={24} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Inicio</span>
                </button>

                {/* 1. JUEGO (PARTIDOS) */}
                <button
                    onClick={() => onTabChange('game')}
                    className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 bg-transparent border-none outline-none p-0 ${activeTab === 'game' ? 'text-[#00E676] -translate-y-1' : 'text-[#94A3B8] hover:text-white'}`}
                >
                    {activeTab === 'game' && <div className="absolute -top-4 w-10 h-1 bg-[#00E676] rounded-b-full shadow-[0_0_10px_#00E676]"></div>}
                    <Calendar size={24} strokeWidth={activeTab === 'game' ? 2.5 : 2} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Juego</span>
                </button>

                {/* 2. LIGAS (MIS POLLAS) - CONDICIONAL */}
                {showLeaguesTab && (
                    <button
                        onClick={() => onTabChange('leagues')}
                        className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 bg-transparent border-none outline-none p-0 ${activeTab === 'leagues' ? 'text-[#00E676] -translate-y-1' : 'text-[#94A3B8] hover:text-white'}`}
                    >
                        {activeTab === 'leagues' && <div className="absolute -top-4 w-10 h-1 bg-[#00E676] rounded-b-full shadow-[0_0_10px_#00E676]"></div>}
                        <Users size={24} strokeWidth={activeTab === 'leagues' ? 2.5 : 2} />
                        <span className="text-[10px] font-black tracking-widest uppercase">Pollas</span>
                    </button>
                )}

                {/* 3. RANKING */}
                <button
                    onClick={() => onTabChange('ranking')}
                    className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 bg-transparent border-none outline-none p-0 ${activeTab === 'ranking' ? 'text-[#00E676] -translate-y-1' : 'text-[#94A3B8] hover:text-white'}`}
                >
                    {activeTab === 'ranking' && <div className="absolute -top-4 w-10 h-1 bg-[#00E676] rounded-b-full shadow-[0_0_10px_#00E676]"></div>}
                    <Trophy size={24} strokeWidth={activeTab === 'ranking' ? 2.5 : 2} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Rank</span>
                </button>

                {/* 4. SIMULADOR */}
                <button
                    onClick={() => onTabChange('bracket')}
                    className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 bg-transparent border-none outline-none p-0 ${activeTab === 'bracket' ? 'text-[#00E676] -translate-y-1' : 'text-[#94A3B8] hover:text-white'}`}
                >
                    {activeTab === 'bracket' && <div className="absolute -top-4 w-10 h-1 bg-[#00E676] rounded-b-full shadow-[0_0_10px_#00E676]"></div>}
                    <Activity size={24} strokeWidth={activeTab === 'bracket' ? 2.5 : 2} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Sim</span>
                </button>

                {/* 5. BONUS */}
                <button
                    onClick={() => onTabChange('bonus')}
                    className={`relative flex flex-col items-center gap-1.5 transition-all duration-300 bg-transparent border-none outline-none p-0 ${activeTab === 'bonus' ? 'text-[#00E676] -translate-y-1' : 'text-[#94A3B8] hover:text-white'}`}
                >
                    {activeTab === 'bonus' && <div className="absolute -top-4 w-10 h-1 bg-[#00E676] rounded-b-full shadow-[0_0_10px_#00E676]"></div>}
                    <Star size={24} strokeWidth={activeTab === 'bonus' ? 2.5 : 2} />
                    <span className="text-[10px] font-black tracking-widest uppercase">Bonus</span>
                </button>

            </div>
        </nav>
    );
};
