import React from 'react';
import { DashboardClient } from '@/components/DashboardClient';

export const SocialLeagueView = ({ leagueId }: { leagueId: string }) => {
    return (
        <div className="w-full min-h-screen bg-[#0F172A]">
            <DashboardClient defaultLeagueId={leagueId} initialTab="home" />
        </div>
    );
};
