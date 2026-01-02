'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { LeagueSettingsPanel } from '@/components/admin/LeagueSettingsPanel';

export default function LeagueAdminSettingsPage() {
    const params = useParams();
    // params.id might be string | string[], force string
    const leagueId = Array.isArray(params.id) ? params.id[0] : params.id;

    if (!leagueId) return null;

    return <LeagueSettingsPanel leagueId={leagueId} defaultTab="editar" hideTabs={true} />;
}
