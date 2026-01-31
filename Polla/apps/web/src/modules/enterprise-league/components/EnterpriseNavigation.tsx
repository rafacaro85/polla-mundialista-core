'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Trophy, Star, MessageSquare, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- ENTERPRISE NAVIGATION ---
interface NavItem {
    id: string; // Added ID for easier check
    label: string;
    icon: React.ReactNode;
    href: string;
    exact?: boolean;
}

interface EnterpriseNavigationProps {
    leagueId: string;
    isEnterpriseActive: boolean;
    planLevel?: number;
}

export const EnterpriseNavigation = ({ leagueId, isEnterpriseActive, planLevel = 1 }: EnterpriseNavigationProps) => {
    const pathname = usePathname();
    const basePath = `/leagues/${leagueId}`;

    // Icons match the General Dashboard (Social)
    const items: NavItem[] = [
        { id: 'home', label: 'Inicio', icon: null, href: basePath, exact: true }, // Icon handled specially
        { id: 'game', label: 'Juego', icon: <Calendar size={20} />, href: `${basePath}/predictions` },
        { id: 'ranking', label: 'Rank', icon: <Trophy size={20} />, href: `${basePath}/ranking` },
        { id: 'sim', label: 'Sim', icon: <Activity size={20} />, href: `${basePath}/simulation` },
        { id: 'bonus', label: 'Bonus', icon: <Star size={20} />, href: `${basePath}/bonus` },
    ];

    // Enterprise Feature: Wall (Plan Oro+ / Level 3+)
    if (isEnterpriseActive && planLevel >= 3) {
        items.push({ id: 'wall', label: 'Muro', icon: <MessageSquare size={20} />, href: `${basePath}/wall` });
    }

    const isActive = (item: NavItem) => {
        if (item.exact) return pathname === item.href;
        return pathname.startsWith(item.href);
    };

    return (
        <>
            {/* DESKTOP SIDEBAR - ENTERPRISE COLORS (Keep original layout but updated items) */}
            <aside className="hidden md:flex flex-col w-64 fixed left-0 top-0 bottom-0 bg-brand-bg border-r border-brand-secondary z-50 pt-20 px-4">
                <div className="space-y-2">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-sm font-bold uppercase tracking-wide",
                                isActive(item)
                                    ? "bg-brand-primary/10 text-brand-primary shadow-[0_0_15px_rgba(0,0,0,0.2)]"
                                    : "text-slate-400 hover:bg-brand-secondary hover:text-brand-text"
                            )}
                        >
                            <span className={cn("transition-transform group-hover:scale-110", isActive(item) && "text-brand-primary")}>
                                {item.id === 'home' ? (
                                    // Custom N Logo for Desktop Sidebar
                                    <div className={cn(
                                        "w-5 h-5 rounded-full flex items-center justify-center border border-current",
                                        isActive(item) ? "bg-brand-primary text-brand-bg" : "bg-transparent"
                                    )}>
                                        <span className="font-black text-[9px]">N</span>
                                    </div>
                                ) : (
                                    item.icon
                                )}
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV - REPLICATING BOTTOMNAV.TSX STYLE */}
            <nav
                className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-bg/95 backdrop-blur-xl border-t border-brand-secondary z-[100] pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]"
                style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)', paddingTop: '12px' }}
            >
                <div className="max-w-md mx-auto flex justify-around items-center px-1">
                    {items.map((item) => {
                        const active = isActive(item);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "relative flex flex-col items-center gap-1 transition-all duration-300 bg-transparent border-none outline-none p-0 w-14",
                                    active ? "-translate-y-1" : "opacity-60 hover:opacity-100"
                                )}
                            >
                                {active && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-primary rounded-full shadow-[0_0_15px_2px_rgba(var(--brand-primary-rgb),0.6)] animate-pulse" />
                                )}

                                {/* ICON RENDER */}
                                {item.id === 'home' ? (
                                    // Custom N Logo
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center border transition-all shadow-lg",
                                        active
                                            ? "bg-brand-primary border-brand-primary text-brand-bg"
                                            : "border-slate-400 bg-transparent text-slate-400"
                                    )}>
                                        <span className="font-black text-[10px]">N</span>
                                    </div>
                                ) : (
                                    // Standard Lucide Icon
                                    React.cloneElement(item.icon as React.ReactElement<any>, {
                                        size: 22,
                                        strokeWidth: active ? 2.5 : 2,
                                        className: active ? "text-brand-primary" : "text-slate-400"
                                    })
                                )}

                                <span className={cn(
                                    "text-[9px] font-black tracking-widest uppercase mt-1",
                                    active ? "text-brand-text" : "text-slate-400"
                                )}>
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </>
    );
};
