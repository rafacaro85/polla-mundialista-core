'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useLeague } from '@/shared/hooks/useLeague';
import { EnterpriseFixture } from '@/modules/enterprise-league/components/EnterpriseFixture';
import { SocialFixture } from '@/modules/social-league/components/SocialFixture';
import { LoadingSpinner } from '@/shared/components/ui/LoadingSpinner';

/**
 * Dispatcher: renders the correct Fixture component based on league type.
 * - Enterprise / COMPANY → EnterpriseFixture (fetches via /leagues/:id/matches internally)
 * - Social              → SocialFixture (fetches via /leagues/:id/matches internally)
 * 
 * Both components self-fetch their own matches via /leagues/:id/matches,
 * so there is NO race condition and NO dependency on a global tournamentId.
 */
export default function PredictionsPage() {
    const params = useParams();
    const leagueId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

    const { league, isLoading } = useLeague(leagueId);

    if (isLoading || !league) {
        return (
            <div className="flex h-64 items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    const isEnterprise = league.type === 'COMPANY' || !!league.isEnterprise;

    if (isEnterprise) {
        return <EnterpriseFixture />;
    }

    // Social league: SocialFixture self-fetches from /leagues/:id/matches
    // tournamentId is not required here — the backend derives it from the league record
    return (
        <SocialFixture
            leagueId={leagueId}
            tournamentId={league.tournamentId}
        />
    );
}
