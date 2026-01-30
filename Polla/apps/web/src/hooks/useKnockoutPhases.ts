"use client";

import { useState, useEffect } from 'react';
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

export function useKnockoutPhases() {
    const [phases, setPhases] = useState<PhaseStatus[]>([]);
    const [nextPhaseInfo, setNextPhaseInfo] = useState<NextPhaseInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPhases = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/knockout-phases/status');
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
            const { data } = await api.get('/knockout-phases/next/info');
            setNextPhaseInfo(data);
        } catch (err) {
            console.error('❌ Error fetching next phase info:', err);
            // Error fetching next phase info, can be ignored if not critical
        }
    };

    useEffect(() => {
        fetchPhases();
        fetchNextPhaseInfo();
    }, []);

    const isPhaseUnlocked = (phase: string): boolean => {
        const phaseStatus = phases.find(p => p.phase === phase);
        return phaseStatus?.isUnlocked || false;
    };

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
