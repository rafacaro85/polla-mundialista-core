'use client';

import Link from 'next/link';
import { UserNav } from '@/components/UserNav';
import { Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';

interface HeaderProps {
  userName: string;
}

export function Header({ userName }: HeaderProps) {
  const { user } = useAppStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0F172A] border-b border-slate-800 shadow-md">
      <div className="container flex h-20 items-center justify-between px-4">

        {/* Left: Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <h1 className="text-white font-russo text-lg leading-none tracking-wide">POLLA <br /> MUNDIALISTA</h1>
            <span className="text-slate-400 text-[10px] font-bold tracking-widest mt-1">FIFA WORLD CUP 2026</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
          <UserNav />
        </div>

      </div>
    </header>
  );
}