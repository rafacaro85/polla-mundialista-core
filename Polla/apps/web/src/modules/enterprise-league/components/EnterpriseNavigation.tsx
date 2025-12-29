'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Star, MessageSquare, Users, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- ENTERPRISE NAVIGATION ISOLATED ---
interface NavItem {
    label: string;
    icon: React.ReactNode;
    href: string;
    exact?: boolean;
}

interface EnterpriseNavigationProps {
    leagueId: string;
    isEnterpriseActive: boolean; // Keep for now to toggle Wall if needed, but this component is FOR enterprise.
}

export const EnterpriseNavigation = ({ leagueId, isEnterpriseActive }: EnterpriseNavigationProps) => {
    const pathname = usePathname();
    const basePath = `/leagues/${leagueId}`;

    const items: NavItem[] = [
        { label: 'Inicio', icon: <Home size={20} />, href: basePath, exact: true },
        { label: 'Juegos', icon: <Gamepad2 size={20} />, href: `${basePath}/predictions` },
        { label: 'Ranking', icon: <Trophy size={20} />, href: `${basePath}/ranking` },
        { label: 'Simulador', icon: <Users size={20} />, href: `${basePath}/simulation` },
        { label: 'Bonus', icon: <Star size={20} />, href: `${basePath}/bonus` },
    ];

    // Enterprise Feature: Wall
    if (isEnterpriseActive) {
        items.push({ label: 'Muro', icon: <MessageSquare size={20} />, href: `${basePath}/wall` });
    }

    const isActive = (item: NavItem) => {
        if (item.exact) return pathname === item.href;
        return pathname.startsWith(item.href);
    };

    return (
        <>
            {/* DESKTOP SIDEBAR - ENTERPRISE COLORS */}
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
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    ))}
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV - ENTERPRISE STYLE */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-bg/95 backdrop-blur-xl border-t border-brand-secondary z-[100] pb-safe pt-2 px-2 shadow-[0_-4px_20px_rgba(0,0,0,0.5)]">
                <div className="flex items-center justify-around overflow-x-auto no-scrollbar gap-1">
                    {items.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[64px] py-1 gap-1 relative",
                                isActive(item) ? "text-brand-primary" : "text-slate-500"
                            )}
                        >
                            {isActive(item) && (
                                <div className="absolute -top-2 h-1 w-8 bg-brand-primary rounded-b-full shadow-[0_0_8px_var(--brand-primary)]" />
                            )}
                            {React.isValidElement(item.icon) ? React.cloneElement(item.icon as React.ReactElement<any>, {
                                size: 22,
                                strokeWidth: isActive(item) ? 2.5 : 2
                            }) : item.icon}
                            <span className="text-[9px] font-black uppercase tracking-tight">
                                {item.label}
                            </span>
                        </Link>
                    ))}
                </div>
            </nav>
        </>
    );
};
