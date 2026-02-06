"use client";

import React from 'react';
import { useKnockoutPhases } from '@/hooks/useKnockoutPhases';
import { PhaseStatusIndicator } from '@/components/PhaseStatusIndicator';
import { LockedPhaseView } from '@/components/LockedPhaseView';
import { Loader2 } from 'lucide-react';

interface DynamicPredictionsWrapperProps {
    children: React.ReactNode;
    currentPhase?: string;
    tournamentId?: string;
}

const PHASE_NAMES: Record<string, string> = {
    'GROUP': 'Fase de Grupos',
    'ROUND_32': 'Dieciseisavos de Final',
    'ROUND_16': 'Octavos de Final',
    'QUARTER': 'Cuartos de Final',
    'SEMI': 'Semifinales',
    'FINAL': 'Final',
};

const PREVIOUS_PHASE: Record<string, string> = {
    'ROUND_32': 'Fase de Grupos',
    'ROUND_16': 'Dieciseisavos de Final',
    'QUARTER': 'Octavos de Final',
    'SEMI': 'Cuartos de Final',
    'FINAL': 'Semifinales',
};

export function DynamicPredictionsWrapper({
    children,
    currentPhase = 'GROUP',
    tournamentId
}: DynamicPredictionsWrapperProps) {
    console.log('🔍 DynamicPredictionsWrapper - Tournament ID:', tournamentId);
    console.log('🔍 DynamicPredictionsWrapper - Current Phase:', currentPhase);
    
    const { phases, nextPhaseInfo, loading, isPhaseUnlocked } = useKnockoutPhases(tournamentId);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-signal" />
            </div>
        );
    }

    // Always allow GROUP phase
    if (currentPhase === 'GROUP') {
        return <>{children}</>;
    }

    // Check if current phase is unlocked
    const unlocked = isPhaseUnlocked(currentPhase);

    if (!unlocked) {
        const previousPhaseName = PREVIOUS_PHASE[currentPhase] || 'la fase anterior';
        const phaseName = PHASE_NAMES[currentPhase] || currentPhase;

        return (
            <LockedPhaseView
                phaseName={phaseName}
                previousPhase={previousPhaseName}
                remainingMatches={nextPhaseInfo?.remainingMatches}
            />
        );
    }

    // Phase is unlocked, show predictions
    return (
        <div>
            {/* Phase Status Banner */}
            <div className="mb-6">
                <PhaseStatusIndicator
                    phase={currentPhase}
                    isUnlocked={true}
                    isCompleted={phases.find(p => p.phase === currentPhase)?.allMatchesCompleted || false}
                    remainingMatches={nextPhaseInfo?.currentPhase === currentPhase ? nextPhaseInfo.remainingMatches : 0}
                />
            </div>

            {/* Actual predictions content */}
            {children}
        </div>
    );
}
