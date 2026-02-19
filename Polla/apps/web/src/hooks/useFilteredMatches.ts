import { useMemo } from 'react';
import { useKnockoutPhases } from './useKnockoutPhases';

/**
 * Hook to filter matches based on unlocked knockout phases
 * Only shows matches from GROUP phase and unlocked knockout phases
 */
export function useFilteredMatches(matches: any[], tournamentId?: string) {
    const { isPhaseUnlocked, loading } = useKnockoutPhases(tournamentId);

    const filteredMatches = useMemo(() => {
        if (loading || !matches) return [];

        return matches.filter((match: any) => {
            const phase = match.phase;
            
            // Always show GROUP phase matches
            if (phase === 'GROUP' || phase === 'GROUP_STAGE' || !phase) {
                return true;
            }

            // For knockout phases, check if unlocked
            return isPhaseUnlocked(phase);
        });
    }, [matches, isPhaseUnlocked, loading]);

    return {
        filteredMatches,
        loading
    };
}
