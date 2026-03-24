import React from 'react';
import { Home, Trophy, ClipboardPen, BarChartBig, Star } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus';
    onTabChange: (tab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus') => void;
    showLeaguesTab?: boolean;
}

// Lista de tabs para evitar repetir el mismo markup 5 veces
const TABS = [
    { id: 'home',        label: 'Inicio',       Icon: Home },
    { id: 'leagues',     label: 'Pollas',        Icon: Trophy },
    { id: 'predictions', label: 'Predicciones',  Icon: ClipboardPen },
    { id: 'ranking',     label: 'Ranking',       Icon: BarChartBig },
    { id: 'bonus',       label: 'Bonus',         Icon: Star },
] as const;

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, showLeaguesTab = true }) => {
    return (
        <nav
            className="fixed bottom-0 left-0 right-0 w-full bg-[#0F172A]/95 backdrop-blur-xl border-t border-[#1E293B] z-[9999] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
            style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999, paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', paddingTop: '12px' }}
        >
            <div className="max-w-md mx-auto flex justify-around items-center px-2">
                {TABS.map(({ id, label, Icon }) => {
                    if (id === 'leagues' && !showLeaguesTab) return null;
                    const isActive = activeTab === id;
                    return (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${isActive ? '-translate-y-1' : 'text-slate-400 hover:text-white'}`}
                            style={isActive ? { color: 'var(--brand-primary, #00E676)' } : undefined}
                        >
                            {isActive && (
                                <div
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full animate-pulse"
                                    style={{ backgroundColor: 'var(--brand-primary, #00E676)', boxShadow: '0 0 15px 2px color-mix(in srgb, var(--brand-primary, #00E676) 60%, transparent)' }}
                                />
                            )}
                            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            <span className="text-[9px] font-black tracking-widest uppercase mt-1">{label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
