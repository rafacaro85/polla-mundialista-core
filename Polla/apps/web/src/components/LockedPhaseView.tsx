"use client";

import React from 'react';
import { Lock, Clock, Info } from 'lucide-react';

interface LockedPhaseViewProps {
    phaseName: string;
    previousPhase: string;
    remainingMatches?: number;
}

export function LockedPhaseView({
    phaseName,
    previousPhase,
    remainingMatches = 0
}: LockedPhaseViewProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="max-w-md w-full bg-[#1E293B] rounded-2xl border border-gray-700 p-8 text-center">
                {/* Lock Icon */}
                <div className="mx-auto w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-gray-500" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3">
                    {phaseName}
                </h2>

                {/* Status Message */}
                <div className="flex items-center justify-center gap-2 text-gray-400 mb-6">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Fase Bloqueada</span>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="text-left text-sm text-blue-200">
                            <p className="mb-2">
                                Esta fase se desbloqueará automáticamente cuando todos los partidos de <strong>{previousPhase}</strong> hayan finalizado.
                            </p>
                            {remainingMatches > 0 && (
                                <p className="text-blue-300 font-semibold">
                                    Partidos pendientes: {remainingMatches}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-500 mb-6">
                    Podrás hacer tus predicciones una vez que esta fase esté disponible.
                    El sistema te notificará cuando se desbloquee.
                </p>

                <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors"
                >
                    Volver a Fase Anterior
                </button>
            </div>
        </div>
    );
}
