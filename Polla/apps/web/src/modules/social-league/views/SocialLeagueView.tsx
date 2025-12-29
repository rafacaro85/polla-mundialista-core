import React from 'react';
import { DashboardClient } from '@/components/DashboardClient';

export const SocialLeagueView = ({ leagueId }: { leagueId: string }) => {
    return <DashboardClient defaultLeagueId={leagueId} initialTab="home" />;
};
