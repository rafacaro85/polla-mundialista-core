'use client';

import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Settings, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useTournament } from '@/hooks/useTournament';

interface HeaderProps {
  userName: string;
  leagueName?: string;
}

export function Header({ userName, leagueName }: HeaderProps) {
  const { user, selectedLeagueId, setSelectedLeague } = useAppStore();
  const { tournamentId } = useTournament();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  // Force Frontend Rebuild - Notification UI
  const isChampionsTheme = tournamentId === 'UCL2526';

  return (
    <header className={`sticky top-0 z-40 w-full border-b shadow-md ${
      isChampionsTheme 
        ? 'bg-[#1e293b] border-blue-900' // Dark slate/blue for Champions
        : 'bg-[#0F172A] border-slate-800' // Default dark
    }`}>
      <div className="container flex h-20 items-center justify-between px-4">

        {/* Left: Logo or Back Button */}
        <div className="flex items-center gap-3">
          {selectedLeagueId && selectedLeagueId !== 'global' ? (
            <Link
              href="/social/mis-pollas"
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-800 transition-colors group"
            >
              <div className="bg-slate-800 p-2 rounded-md group-hover:bg-slate-700 transition-colors border border-slate-700">
                <ChevronLeft size={20} className="text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Volver</span>
                {leagueName ? (
                  <span className="text-lg font-russ text-white leading-none whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px] md:max-w-xs">{leagueName}</span>
                ) : (
                  <span className="text-sm font-bold text-white leading-none">Mis Pollas</span>
                )}
              </div>
            </Link>
          ) : (
            <>
              {isChampionsTheme ? (
                 <div className="flex items-center">
                    <img 
                      src="/images/ucl-logo.png" 
                      alt="UEFA Champions League" 
                      className="h-16 w-auto object-contain filter brightness-0 invert"
                    />
                 </div>
              ) : (
                <div className="flex items-center gap-1">
                  <img 
                      src="/images/lpv/lpv-full-logo.png" 
                      alt="La Polla Virtual" 
                      className="h-12 w-auto object-contain"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">

          <NotificationBell />
          <UserNav />
        </div>

      </div>
    </header>
  );
}