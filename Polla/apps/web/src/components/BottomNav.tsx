'use client';

import React, { useState } from 'react';
import { Home, Trophy, ClipboardPen, BarChartBig, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface BottomNavProps {
    activeTab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus';
    onTabChange: (tab: 'home' | 'leagues' | 'predictions' | 'ranking' | 'bonus') => void;
    showLeaguesTab?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange, showLeaguesTab = true }) => {
    const [collapsed, setCollapsed] = useState(false);

    const tabs = [
        { id: 'home' as const, label: 'Inicio', icon: Home },
        ...(showLeaguesTab ? [{ id: 'leagues' as const, label: 'Pollas', icon: Trophy }] : []),
        { id: 'predictions' as const, label: 'Predicciones', icon: ClipboardPen },
        { id: 'ranking' as const, label: 'Ranking', icon: BarChartBig },
        { id: 'bonus' as const, label: 'Bonus', icon: Star },
    ];

    return (
        <>
            {/* ── MOBILE: barra fija inferior ── */}
            {/* ── MOBILE: barra fija inferior ── */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 w-full backdrop-blur-xl border-t z-[9999] shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
                style={{ 
                    paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', 
                    paddingTop: '12px',
                    backgroundColor: 'var(--brand-bg, #0F172A)',
                    borderColor: 'var(--brand-secondary, #1E293B)'
                }}
            >
                <div className="max-w-md mx-auto flex justify-around items-center px-2">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            className={`relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14 ${
                                activeTab === id ? 'text-[var(--brand-primary,#00E676)] -translate-y-1' : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {activeTab === id && (
                                <div 
                                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full animate-pulse" 
                                    style={{ 
                                        backgroundColor: 'var(--brand-primary, #00E676)',
                                        boxShadow: '0 0 15px 2px var(--brand-primary)'
                                    }}
                                />
                            )}
                            <Icon size={22} strokeWidth={activeTab === id ? 2.5 : 2} />
                            <span className="text-[9px] font-black tracking-widest uppercase mt-1">{label}</span>
                        </button>
                    ))}
                </div>
            </nav>

            {/* ── DESKTOP: sidebar vertical colapsable ── */}
            <aside
                className={`hidden md:flex flex-col fixed left-0 top-16 bottom-0 border-r z-50 transition-all duration-300 ease-in-out ${
                    collapsed ? 'w-[68px]' : 'w-64'
                }`}
                style={{ 
                    backgroundColor: 'var(--brand-bg, #0F172A)',
                    borderColor: 'var(--brand-secondary, #1E293B)'
                }}
            >
                {/* Botón de colapsar */}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="absolute -right-3 top-6 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-10 shadow-lg"
                    style={{ 
                        backgroundColor: 'var(--brand-secondary, #1E293B)',
                        border: '1px solid var(--brand-accent, #334155)'
                    }}
                    title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
                >
                    {collapsed
                        ? <ChevronRight size={12} />
                        : <ChevronLeft size={12} />
                    }
                </button>

                {/* Items de navegación */}
                <div className="flex flex-col gap-1 pt-4 px-3 overflow-hidden">
                    {tabs.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => onTabChange(id)}
                            title={collapsed ? label : undefined}
                            className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-sm font-bold uppercase tracking-wide w-full ${
                                activeTab === id
                                    ? 'text-[var(--brand-primary,#00E676)]'
                                    : 'text-slate-400 hover:text-white'
                            } ${collapsed ? 'justify-center' : 'justify-start'}`}
                            style={{
                                backgroundColor: activeTab === id ? 'color-mix(in srgb, var(--brand-primary) 10%, transparent)' : 'transparent',
                            }}
                        >
                            <Icon
                                size={20}
                                strokeWidth={activeTab === id ? 2.5 : 2}
                                className={`shrink-0 transition-transform group-hover:scale-110 ${activeTab === id ? 'text-[var(--brand-primary,#00E676)]' : ''}`}
                            />
                            {!collapsed && (
                                <span className="whitespace-nowrap overflow-hidden transition-all duration-200 opacity-100">
                                    {label}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </aside>
        </>
    );
};
