'use client';

import React, { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export const GlobalThemeProvider = ({ children }: { children: React.ReactNode }) => {
    const { theme } = useAppStore();

    useEffect(() => {
        const root = document.documentElement;
        if (theme?.primary && theme?.secondary) {
            root.style.setProperty('--brand-primary', theme.primary);
            root.style.setProperty('--brand-secondary', theme.secondary);
        } else {
            // Revert defaults
            root.style.setProperty('--brand-primary', '#00E676'); // Signal
            root.style.setProperty('--brand-secondary', '#0F172A'); // Obsidian
        }
    }, [theme]);

    return <>{children}</>;
};
