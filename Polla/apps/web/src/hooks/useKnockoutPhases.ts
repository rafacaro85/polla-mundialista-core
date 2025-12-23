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
            console.log('🔍 Fetching knockout phases...');
            const { data } = await api.get('/knockout-phases/status');
            console.log('✅ Phases fetched:', data);
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
            console.log('🔍 Fetching next phase info...');
            const { data } = await api.get('/knockout-phases/next/info');
            console.log('✅ Next phase info:', data);
            setNextPhaseInfo(data);
        } catch (err) {
            console.error('❌ Error fetching next phase info:', err);
        }
    };

    useEffect(() => {
        fetchPhases();
        fetchNextPhaseInfo();

        // Poll every 30 seconds to check for phase unlocks
        const interval = setInterval(() => {
            fetchPhases();
            fetchNextPhaseInfo();
        }, 30000);

        return () => clearInterval(interval);
    }, []);

    const isPhaseUnlocked = (phase: string): boolean => {
        const phaseStatus = phases.find(p => p.phase === phase);
        return phaseStatus?.isUnlocked || false;
    };

    const getPhaseStatus = (phase: string): PhaseStatus | undefined => {
        return phases.find(p => p.phase === phase);
    };

    return {
        phases,
        nextPhaseInfo,
        loading,
        error,
        isPhaseUnlocked,
        getPhaseStatus,
        refetch: fetchPhases,
    };
}
