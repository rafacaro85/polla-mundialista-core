import React from 'react';
import { Home, Trophy, ClipboardPen, BarChartBig, Star } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus';
    onTabChange: (tab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus') => void;
    showLeaguesTab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, showLeaguesTab = true }) => {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 w-full bg-[#0F172A]/95 backdrop-blur-xl border-t border-[#1E293B] z-[9999] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', paddingTop: '12px' }}
        >
            <div className="max-w-md mx-auto flex justify-around items-center px-2">

                {/* 1. INICIO */}
                <button
                    onClick={() => onTabChange('home')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'home' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'home' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <Home size={22} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Inicio</span>
                </button>

                {/* 2. POLLAS */}
                {showLeaguesTab && (
                    <button
                        onClick={() => onTabChange('leagues')}
                        className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'leagues' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                    >
                        {activeTab === 'leagues' && (
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                        )}
                        <Trophy size={22} strokeWidth={activeTab === 'leagues' ? 2.5 : 2} />
                        <span className="text-[9px] font-black tracking-widest uppercase mt-1">Pollas</span>
                    </button>
                )}

                {/* 3. PREDICCIONES (Centro) */}
                <button
                    onClick={() => onTabChange('predictions')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'predictions' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'predictions' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <ClipboardPen size={22} strokeWidth={activeTab === 'predictions' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Predicciones</span>
                </button>

                {/* 4. RANKING */}
                <button
                    onClick={() => onTabChange('ranking')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'ranking' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'ranking' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <BarChartBig size={22} strokeWidth={activeTab === 'ranking' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Ranking</span>
                </button>

                {/* 5. BONUS */}
                <button
                    onClick={() => onTabChange('bonus')}
                    className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${activeTab === 'bonus' ? 'text-[#00E676] -translate-y-1' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeTab === 'bonus' && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#00E676] rounded-full shadow-[0_0_15px_2px_rgba(0,230,118,0.6)] animate-pulse"></div>
                    )}
                    <Star size={22} strokeWidth={activeTab === 'bonus' ? 2.5 : 2} />
                    <span className="text-[9px] font-black tracking-widest uppercase mt-1">Bonus</span>
                </button>

            </div>
        </nav>
    );
};
