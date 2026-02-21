'use client';

import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Settings, ChevronLeft, LayoutGrid } from 'lucide-react';
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
                      src="/images/wc-logo.png" 
                      alt="FIFA World Cup 2026" 
                      className="h-20 w-auto object-contain"
                  />
                  <div className="flex flex-col">
                    <h1 className="font-russo text-base leading-none tracking-wide text-white">
                      {tournamentId === 'TEST_LIVE_MONDAY' ? 'PRUEBAS' : 'POLLA'} <br /> 
                      {tournamentId === 'TEST_LIVE_MONDAY' ? 'EN VIVO' : 'MUNDIALISTA'}
                    </h1>
                    <span className={`${tournamentId === 'TEST_LIVE_MONDAY' ? 'text-amber-500' : 'text-slate-400'} text-[8px] font-bold tracking-widest mt-1`}>
                      {tournamentId === 'TEST_LIVE_MONDAY' ? 'AMBIENTE DE PRUEBAS' : 'FIFA WORLD CUP 2026'}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <Link 
            href="/hub" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              isChampionsTheme 
                ? 'bg-blue-800/50 hover:bg-blue-700 text-blue-200' 
                : 'bg-emerald-900/50 hover:bg-emerald-800 text-emerald-200'
            }`}
          >
            <LayoutGrid size={16} />
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">Torneos</span>
          </Link>

          <NotificationBell />
          <UserNav />
        </div>

      </div>
    </header>
  );
}