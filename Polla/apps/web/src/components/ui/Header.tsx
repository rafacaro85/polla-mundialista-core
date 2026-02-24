'use client';

import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ChevronLeft } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  userName: string;
  leagueName?: string;
  tournamentId?: string;
  isEnterprise?: boolean;
  backUrl?: string;
}

/**
 * Header unificado para ligas sociales.
 * Layout: [ ← ] [ Logo Torneo ] [ nombre liga ] [espacio] [ 🔔 ] [ 👤 foto ]
 */
export function Header({ userName, leagueName, tournamentId, isEnterprise, backUrl }: HeaderProps) {
  const { selectedLeagueId } = useAppStore();

  // Determinar logo del torneo basado en el tournamentId de la liga específica
  const getTournamentLogo = (tid?: string) => {
    if (!tid) return null;
    const t = tid.toUpperCase();
    if (t.includes('UCL') || t.includes('CHAMPIONS')) {
      return { src: '/images/ucl-logo.png', alt: 'Champions League', invert: true };
    }
    if (t.includes('WC') || t.includes('MUNDIAL') || t.includes('WORLD')) {
      return { src: '/images/wc-logo.png', alt: 'FIFA World Cup', invert: false };
    }
    return null;
  };

  const tournamentLogo = getTournamentLogo(tournamentId);
  const resolvedBackUrl = backUrl || (isEnterprise ? '/empresa/mis-pollas' : '/social/mis-pollas');
  const showBackButton = selectedLeagueId && selectedLeagueId !== 'global';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F172A]/95 backdrop-blur-md border-b border-white/5 shadow-lg">
      <div className="h-16 flex items-center justify-between px-4 max-w-7xl mx-auto">

        {/* Izquierda: Flecha volver + logo torneo + nombre liga */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBackButton && (
            <Link
              href={resolvedBackUrl}
              className="p-1.5 rounded-xl hover:bg-white/8 transition-colors text-slate-400 hover:text-white shrink-0"
              title="Volver"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </Link>
          )}

          {/* Logo torneo */}
          {tournamentLogo && (
            <div className="shrink-0">
              <img
                src={tournamentLogo.src}
                alt={tournamentLogo.alt}
                className={`h-8 w-auto object-contain ${tournamentLogo.invert ? 'brightness-0 invert' : ''}`}
              />
            </div>
          )}

          {/* Nombre de la liga */}
          {leagueName && (
            <div className="min-w-0">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.18em] leading-none mb-0.5">
                Volver
              </p>
              <h1 className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[140px] md:max-w-[260px] leading-none">
                {leagueName}
              </h1>
            </div>
          )}
        </div>

        {/* Derecha: Campana + Avatar con foto */}
        <div className="flex items-center gap-3 shrink-0">
          <NotificationBell />
          <UserNav />
        </div>
      </div>
    </header>
  );
}