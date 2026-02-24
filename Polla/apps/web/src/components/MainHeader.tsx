"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { 
    Trophy, 
    ShieldAlert,
    Settings
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useLeagues } from '@/hooks/useLeagues';
import { UserNav } from './UserNav';

export function MainHeader() {
    const { user, selectedLeagueId, setSelectedLeague } = useAppStore();
    const { leagues } = useLeagues();
    const router = useRouter();
    const pathname = usePathname();

    const isSuperAdmin = user?.role === 'SUPER_ADMIN';

    return (
        <header className="sticky top-0 z-[50] w-full border-b border-white/5 bg-[#0F172A]/80 backdrop-blur-xl">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
                
                {/* LOGO */}
                <Link href="/gateway" className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-shrink-0">
                    <img 
                        src="/images/lpv/lpv-full-logo.png" 
                        alt="La Polla Virtual" 
                        className="h-10 w-auto object-contain"
                    />
                </Link>


                {/* RIGHT: ACTIONS */}
                <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                    
                    {/* SUPER ADMIN SHORTCUT */}
                    {isSuperAdmin && (
                        <Link 
                            href="/super-admin"
                            className={`p-2 rounded-xl transition-all border ${
                                pathname.includes('/super-admin') 
                                ? 'bg-[#00E676]/10 border-[#00E676] text-[#00E676]' 
                                : 'bg-white/5 border-white/5 text-slate-400 hover:text-white hover:border-white/10'
                            }`}
                            title="Super Admin"
                        >
                            <ShieldAlert size={20} />
                        </Link>
                    )}


                    {/* CURRENT LEAGUE SETTINGS SHORTCUT */}

                    <div className="h-8 w-px bg-white/5 mx-1"></div>

                    {/* USER NAV */}
                    <UserNav />
                </div>
            </div>
        </header>
    );
}
