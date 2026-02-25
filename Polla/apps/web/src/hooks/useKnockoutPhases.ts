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
        // UCL no tiene fase GROUP — siempre bloqueada para evitar mostrar partidos incorrectos
        if (tournamentId === 'UCL2526' && (phase === 'GROUP' || !phase)) {
            return false;
        }

        // UCL usa fases PLAYOFF_N (ida/vuelta) — buscar en BD, fail-open si no están
        if (tournamentId === 'UCL2526' && phase?.startsWith('PLAYOFF')) {
            const phaseStatus = phases.find(p => p.phase === phase);
            if (phaseStatus) return phaseStatus.isUnlocked;
            // Si no está en BD aún, desbloquear por defecto (fail-open)
            // Esto evita que los partidos UCL desaparezcan si falta el seed
            return true;
        }

        // WC/Estándar: GROUP siempre visible
        if (phase === 'GROUP' || !phase) return true;

        // Fases de eliminación estándar: buscar en BD
        const phaseStatus = phases.find(p => p.phase === phase);
        if (phaseStatus) return phaseStatus.isUnlocked;

        // Fail-closed para fases desconocidas — no mostrar hasta que el admin desbloquee
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
