'use client';

import React from 'react';
import { DashboardClient } from '@/components/DashboardClient';

// Esta página ahora renderiza el Dashboard completo, pero iniciado en el contexto de la liga
// Esto unifica la experiencia de usuario: al entrar a una polla, ves las pestañas y todo integrado.

interface PageProps {
    params: {
        id: string;
    };
}

export default function LeagueDashboardPage({ params }: PageProps) {
    // Renderizamos el DashboardClient pasándole el ID de la liga y la pestaña inicial 'home'
    return (
        <DashboardClient
            defaultLeagueId={params.id}
            initialTab="home"
        />
    );
}
