'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LeagueSettingsPanel } from '@/components/admin/LeagueSettingsPanel';

export default function LeagueAdminBonusPage() {
    const params = useParams();
    const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!leagueId) return null;

    return <LeagueSettingsPanel leagueId={leagueId} defaultTab="bonus" />;
}
