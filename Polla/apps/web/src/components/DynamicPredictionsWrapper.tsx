"use client";

import React from 'react';
import { useKnockoutPhases } from '@/hooks/useKnockoutPhases';
import { Loader2 } from 'lucide-react';

interface DynamicPredictionsWrapperProps {
    children: React.ReactNode;
    tournamentId?: string;
}

/**
 * Este componente antes envolvía las fases eliminatorias con avisos de bloqueo.
 * A petición del usuario, se ha simplificado para que sea un passthrough (solo maneja loading),
 * ya que el sistema de progreso del torneo (Dashboard) ya informa del estado de las fases.
 */
export function DynamicPredictionsWrapper({
    children,
    tournamentId
}: DynamicPredictionsWrapperProps) {
    const { loading } = useKnockoutPhases(tournamentId);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-signal" />
            </div>
        );
    }

    return <>{children}</>;
}
