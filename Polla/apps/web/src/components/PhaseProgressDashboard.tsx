"use client";

import React, { useState } from 'react';
import { useKnockoutPhases } from '@/hooks/useKnockoutPhases';
import { PhaseStatusIndicator } from '@/components/PhaseStatusIndicator';
import { Loader2, Trophy, ChevronDown, ChevronUp } from 'lucide-react';

interface PhaseProgressDashboardProps {
    onPhaseClick?: (phase: string) => void;
}

export function PhaseProgressDashboard({ onPhaseClick }: PhaseProgressDashboardProps) {
    const { phases, nextPhaseInfo, loading, error } = useKnockoutPhases();
    const [isExpanded, setIsExpanded] = useState(false);

    if (loading) {
        return (
            <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-signal" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#1E293B] rounded-xl p-6 border border-red-500/30">
                <div className="text-center py-4">
                    <p className="text-red-400 text-sm">Error al cargar progreso: {error}</p>
                    <p className="text-gray-500 text-xs mt-2">Verifica la consola para más detalles</p>
                </div>
            </div>
        );
    }

    if (!phases || phases.length === 0) {
        return (
            <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-signal/10 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-signal" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">Progreso del Torneo</h3>
                        <p className="text-sm text-gray-400">Fases desbloqueadas para predicciones</p>
                    </div>
                </div>
                <div className="text-center py-4">
                    <p className="text-gray-400 text-sm">No hay datos de fases disponibles</p>
                    <p className="text-gray-500 text-xs mt-1">El sistema se está inicializando...</p>
                </div>
            </div>
        );
    }

    // Count unlocked and completed phases
    const unlockedCount = phases.filter(p => p.isUnlocked).length;
    const completedCount = phases.filter(p => p.allMatchesCompleted).length;

    const handleIndicatorClick = (phase: string) => {
        setIsExpanded(false);
        if (onPhaseClick) {
            onPhaseClick(phase);
        }
    };

    return (
        <div className="bg-[#1E293B] rounded-xl border border-gray-700 overflow-hidden">
            {/* Header - Always Visible - Clickable */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-signal/10 rounded-lg flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-signal" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg font-bold text-white">Progreso del Torneo</h3>
                        <p className="text-xs text-gray-400">
                            {completedCount} completada{completedCount !== 1 ? 's' : ''} • {unlockedCount} desbloqueada{unlockedCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {nextPhaseInfo && !nextPhaseInfo.isComplete && nextPhaseInfo.remainingMatches > 0 && (
                        <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                            {nextPhaseInfo.remainingMatches} pendientes
                        </span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                </div>
            </button>

            {/* Collapsible Content */}
            {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-700">
                    {/* Phase Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                        {phases.map((phase) => (
                            <PhaseStatusIndicator
                                key={phase.phase}
                                phase={phase.phase}
                                isUnlocked={phase.isUnlocked}
                                isCompleted={phase.allMatchesCompleted}
                                onClick={handleIndicatorClick}
                            />
                        ))}
                    </div>

                    {/* Next Phase Info */}
                    {nextPhaseInfo && !nextPhaseInfo.isComplete && nextPhaseInfo.remainingMatches > 0 && (
                        <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                            <p className="text-xs text-blue-200">
                                <strong>{nextPhaseInfo.remainingMatches}</strong> partido{nextPhaseInfo.remainingMatches !== 1 ? 's' : ''} pendiente{nextPhaseInfo.remainingMatches !== 1 ? 's' : ''} para desbloquear la siguiente fase
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
