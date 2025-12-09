"use client";
import React from 'react';
import { useParams } from 'next/navigation';
import { LeagueSettingsPanel } from '@/components/admin/LeagueSettingsPanel';
import { Header } from '@/components/ui/Header';

import { useAppStore } from '@/store/useAppStore';

export default function LeagueAdminPage() {
    const { id } = useParams();
    const { user } = useAppStore();

    return (
        <div className="min-h-screen bg-[#0F172A] flex flex-col">
            <Header userName={user?.nickname || 'Usuario'} />
            <div className="flex-1">
                <LeagueSettingsPanel leagueId={id as string} />
            </div>
        </div>
    );
}
