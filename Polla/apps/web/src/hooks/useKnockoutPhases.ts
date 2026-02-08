"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';

export interface PhaseStatus {
    id: string;
    phase: string;
    isUnlocked: boolean;
    unlockedAt: Date | null;
    allMatchesCompleted: boolean;
}

export interface NextPhaseInfo {
    currentPhase: string;
    nextPhase: string | null;
    isComplete: boolean;
    remainingMatches: number;
}

export function useKnockoutPhases(tournamentId?: string) {
    const [phases, setPhases] = useState<PhaseStatus[]>([]);
    const [nextPhaseInfo, setNextPhaseInfo] = useState<NextPhaseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPhases = async () => {
        try {
            setLoading(true);
            const params = tournamentId ? { tournamentId } : {};
            const { data } = await api.get('/knockout-phases/status', { params });
            setPhases(data);
            setError(null);
        } catch (err: any) {
            console.error('❌ Error fetching phases:', err);
            console.error('Error details:', err.response?.data);
            setError(err.message || 'Error al cargar fases');
        } finally {
            setLoading(false);
        }
    };

    const fetchNextPhaseInfo = async () => {
        try {
            const params = tournamentId ? { tournamentId } : {};
            const { data } = await api.get('/knockout-phases/next/info', { params });
            setNextPhaseInfo(data);
        } catch (err) {
            console.error('❌ Error fetching next phase info:', err);
            // Error fetching next phase info, can be ignored if not critical
        }
    };

    useEffect(() => {
        fetchPhases();
        fetchNextPhaseInfo();
    }, [tournamentId]);

    const isPhaseUnlocked = useCallback((phase: string): boolean => {
        // Always unlock GROUP phase
        if (phase === 'GROUP' || !phase) return true;
        
        const phaseStatus = phases.find(p => p.phase === phase);
        
        // If we have explicit data from backend, use it
        if (phaseStatus) {
            return phaseStatus.isUnlocked;
        }

        // Default: If no data yet and it's WC2026, lock everything except GROUP
        if (tournamentId === 'WC2026') {
            return false;
        }

        return false;
    }, [phases, tournamentId]);

    const getPhaseStatus = (phase: string): PhaseStatus | undefined => {
        return phases.find(p => p.phase === phase);
    };

    const refetchAll = async () => {
        await Promise.all([fetchPhases(), fetchNextPhaseInfo()]);
    };

    return {
        phases,
        nextPhaseInfo,
        loading,
        error,
        isPhaseUnlocked,
        getPhaseStatus,
        refetch: refetchAll,
    };
}
