'use client';

import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Settings, ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  userName: string;
  leagueName?: string;
}

export function Header({ userName, leagueName }: HeaderProps) {
  const { user, selectedLeagueId, setSelectedLeague } = useAppStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F172A] border-b border-slate-800 shadow-md">
      <div className="container flex h-20 items-center justify-between px-4">

        {/* Left: Logo or Back Button */}
        <div className="flex items-center gap-3">
          {selectedLeagueId && selectedLeagueId !== 'global' ? (
            <Link
              href="/dashboard"
              onClick={() => setSelectedLeague('global')}
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
                  <span className="text-sm font-bold text-white leading-none">Global</span>
                )}
              </div>
            </Link>
          ) : (
            <div className="flex flex-col">
              <h1 className="text-white font-russo text-lg leading-none tracking-wide">POLLA <br /> MUNDIALISTA</h1>
              <span className="text-slate-400 text-[10px] font-bold tracking-widest mt-1">FIFA WORLD CUP 2026</span>
            </div>
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