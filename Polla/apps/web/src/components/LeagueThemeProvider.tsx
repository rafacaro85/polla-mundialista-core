'use client';

import React, { useEffect } from 'react';

interface LeagueThemeProviderProps {
    primaryColor?: string;
    secondaryColor?: string;
    children: React.ReactNode;
}

export default function LeagueThemeProvider({ primaryColor, secondaryColor, children }: LeagueThemeProviderProps) {
    useEffect(() => {
        const root = document.documentElement;

        // Función auxiliar para convertir HEX a RGB para opacidades de Tailwind si se usa var(--primary) / <alpha>
        // Por ahora, inyectaremos el valor directo.

        if (primaryColor) {
            root.style.setProperty('--brand-primary', primaryColor);
        } else {
            root.style.removeProperty('--brand-primary');
        }

        if (secondaryColor) {
            root.style.setProperty('--brand-secondary', secondaryColor);
        } else {
            root.style.removeProperty('--brand-secondary');
        }

    }, [primaryColor, secondaryColor]);

    return <>{children}</>;
}
