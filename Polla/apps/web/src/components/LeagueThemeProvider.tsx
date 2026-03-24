'use client';

import React, { useEffect } from 'react';

interface LeagueThemeProviderProps {
    primaryColor?: string;
    secondaryColor?: string;
    bgColor?: string;
    textColor?: string;
    children: React.ReactNode;
}

export default function LeagueThemeProvider({ primaryColor, secondaryColor, bgColor, textColor, children }: LeagueThemeProviderProps) {
    useEffect(() => {
        const root = document.documentElement;

        if (primaryColor) root.style.setProperty('--brand-primary', primaryColor);
        else root.style.removeProperty('--brand-primary');

        if (secondaryColor) root.style.setProperty('--brand-secondary', secondaryColor);
        else root.style.removeProperty('--brand-secondary');

        if (bgColor) root.style.setProperty('--brand-bg', bgColor);
        else root.style.removeProperty('--brand-bg');

        if (textColor) root.style.setProperty('--brand-text', textColor);
        else root.style.removeProperty('--brand-text');

    }, [primaryColor, secondaryColor, bgColor, textColor]);

    return <>{children}</>;
}
