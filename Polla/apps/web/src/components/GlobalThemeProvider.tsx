'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const GlobalThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useAppStore();

    useEffect(() => {
        const root = document.documentElement;
        if (theme?.primary && theme?.secondary) {
            // 1. Brand Variables
            root.style.setProperty('--brand-primary', theme.primary);
            root.style.setProperty('--brand-secondary', theme.secondary);

            // 2. Structural Overrides (Theming Core)
            // Fondo Principal
            root.style.setProperty('--obsidian', theme.secondary);

            // Fondo Secundario (Cartas) - Un poco más claro (mezcla con blanco 10%)
            // Usamos color-mix nativo de CSS moderno
            root.style.setProperty('--carbon', `color-mix(in srgb, ${theme.secondary}, white 8%)`);

            // Accent / Signal
            root.style.setProperty('--signal', theme.primary);

            // Ajustar bordes
            root.style.setProperty('--border', `color-mix(in srgb, ${theme.secondary}, white 20%)`);

        } else {
            // Revert defaults to Original Palette
            root.style.setProperty('--brand-primary', '#00E676');
            root.style.setProperty('--brand-secondary', '#0F172A');

            root.style.setProperty('--obsidian', '#0F172A');
            root.style.setProperty('--carbon', '#1E293B');
            root.style.setProperty('--signal', '#00E676');
            root.style.setProperty('--border', '#334155');
        }
    }, [theme]);

    return <>{children}</>;
};
