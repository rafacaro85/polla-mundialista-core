'use client';

import React, { useEffect } from 'react';

interface LeagueThemeProviderProps {
    primaryColor?: string;
    secondaryColor?: string;
    bgColor?: string;
    textColor?: string;
    children: React.ReactNode;
}

/**
 * Inyecta los colores de marca como CSS variables en el :root del documento.
 * - Solo actualiza una variable si hay un valor concreto (nunca borra si recibe undefined).
 * - NO limpia las variables al desmontarse, para evitar flashes de color
 *   al navegar entre páginas dentro de la misma app corporativa.
 */
export default function LeagueThemeProvider({ primaryColor, secondaryColor, bgColor, textColor, children }: LeagueThemeProviderProps) {
    useEffect(() => {
        const root = document.documentElement;

        if (primaryColor) root.style.setProperty('--brand-primary', primaryColor);
        if (secondaryColor) root.style.setProperty('--brand-secondary', secondaryColor);
        if (bgColor) root.style.setProperty('--brand-bg', bgColor);
        if (textColor) root.style.setProperty('--brand-text', textColor);

        // IMPORTANTE: No se limpian las variables al desmontar.
        // Esto evita el flash de colores default cuando el usuario navega
        // entre /leagues/:id y /dashboard, mientras el nuevo ThemeProvider carga.

    }, [primaryColor, secondaryColor, bgColor, textColor]);

    return <>{children}</>;
}
