"use client";

import React from 'react';
import { Lock, Unlock, CheckCircle, Clock } from 'lucide-react';

interface PhaseStatusIndicatorProps {
    phase: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    remainingMatches?: number;
    onClick?: (phase: string) => void;
}

const PHASE_NAMES: Record<string, string> = {
    'GROUP': 'Fase de Grupos',
    'ROUND_32': 'Dieciseisavos de Final',
    'ROUND_16': 'Octavos de Final',
    'QUARTER': 'Cuartos de Final',
    'SEMI': 'Semifinales',
    '3RD_PLACE': 'Tercer Puesto',
    'FINAL': 'Final',
};

export function PhaseStatusIndicator({
    phase,
    isUnlocked,
    isCompleted,
    remainingMatches = 0,
    onClick,
}: PhaseStatusIndicatorProps) {
    const phaseName = PHASE_NAMES[phase] || phase;

    const baseClasses = "flex items-center gap-2 px-4 py-2 border rounded-lg transition-all duration-200 w-full text-left";
    const clickableClasses = onClick ? "cursor-pointer hover:scale-[1.02] active:scale-95 hover:shadow-lg" : "";

    if (isCompleted) {
        return (
            <button
                onClick={() => onClick?.(phase)}
                className={`${baseClasses} ${clickableClasses} bg-green-500/10 border-green-500/30`}
            >
                <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
                <div>
                    <div className="font-semibold text-green-400 leading-tight">{phaseName}</div>
                    <div className="text-[10px] text-green-300">Completada</div>
                </div>
            </button>
        );
    }

    if (isUnlocked) {
        return (
            <button
                onClick={() => onClick?.(phase)}
                className={`${baseClasses} ${clickableClasses} bg-signal/10 border-signal/30 shadow-[0_0_15px_rgba(0,230,118,0.1)]`}
            >
                <Unlock className="w-5 h-5 text-signal shrink-0" />
                <div>
                    <div className="font-semibold text-signal leading-tight">{phaseName}</div>
                    <div className="text-[10px] text-gray-400">
                        {remainingMatches > 0
                            ? `${remainingMatches} pendiente${remainingMatches !== 1 ? 's' : ''}`
                            : 'Disponible'
                        }
                    </div>
                </div>
            </button>
        );
    }

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg opacity-40">
            <Lock className="w-5 h-5 text-gray-500 shrink-0" />
            <div>
                <div className="font-semibold text-gray-400 leading-tight">{phaseName}</div>
                <div className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Bloqueada
                </div>
            </div>
        </div>
    );
}
