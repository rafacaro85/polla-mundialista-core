"use client";

import React from 'react';
import { useKnockoutPhases } from '@/hooks/useKnockoutPhases';
import { PhaseStatusIndicator } from '@/components/PhaseStatusIndicator';
import { Loader2, Trophy } from 'lucide-react';

export function PhaseProgressDashboard() {
    const { phases, nextPhaseInfo, loading, error } = useKnockoutPhases();

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

    return (
        <div className="bg-[#1E293B] rounded-xl p-6 border border-gray-700">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-signal/10 rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-signal" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">Progreso del Torneo</h3>
                    <p className="text-sm text-gray-400">Fases desbloqueadas para predicciones</p>
                </div>
            </div>

            {/* Phase Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {phases.map((phase) => (
                    <PhaseStatusIndicator
                        key={phase.phase}
                        phase={phase.phase}
                        isUnlocked={phase.isUnlocked}
                        isCompleted={phase.allMatchesCompleted}
                    />
                ))}
            </div>

            {/* Next Phase Info */}
            {nextPhaseInfo && !nextPhaseInfo.isComplete && nextPhaseInfo.remainingMatches > 0 && (
                <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm text-blue-200">
                        <strong>{nextPhaseInfo.remainingMatches}</strong> partido{nextPhaseInfo.remainingMatches !== 1 ? 's' : ''} pendiente{nextPhaseInfo.remainingMatches !== 1 ? 's' : ''} para desbloquear la siguiente fase
                    </p>
                </div>
            )}
        </div>
    );
}
