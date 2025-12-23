"use client";

import React from 'react';
import { Lock, Unlock, CheckCircle, Clock } from 'lucide-react';

interface PhaseStatusIndicatorProps {
    phase: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    remainingMatches?: number;
}

const PHASE_NAMES: Record<string, string> = {
    'GROUP': 'Fase de Grupos',
    'ROUND_32': 'Dieciseisavos de Final',
    'ROUND_16': 'Octavos de Final',
    'QUARTER': 'Cuartos de Final',
    'SEMI': 'Semifinales',
    'FINAL': 'Final',
};

export function PhaseStatusIndicator({
    phase,
    isUnlocked,
    isCompleted,
    remainingMatches = 0,
}: PhaseStatusIndicatorProps) {
    const phaseName = PHASE_NAMES[phase] || phase;

    if (isCompleted) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                    <div className="font-semibold text-green-400">{phaseName}</div>
                    <div className="text-xs text-green-300">Completada</div>
                </div>
            </div>
        );
    }

    if (isUnlocked) {
        return (
            <div className="flex items-center gap-2 px-4 py-2 bg-signal/10 border border-signal/30 rounded-lg">
                <Unlock className="w-5 h-5 text-signal" />
                <div>
                    <div className="font-semibold text-signal">{phaseName}</div>
                    <div className="text-xs text-gray-400">
                        {remainingMatches > 0
                            ? `${remainingMatches} partido${remainingMatches !== 1 ? 's' : ''} pendiente${remainingMatches !== 1 ? 's' : ''}`
                            : 'Disponible para predicciones'
                        }
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg opacity-60">
            <Lock className="w-5 h-5 text-gray-500" />
            <div>
                <div className="font-semibold text-gray-400">{phaseName}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Bloqueada
                </div>
            </div>
        </div>
    );
}
