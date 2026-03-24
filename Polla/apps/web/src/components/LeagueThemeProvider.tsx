'use client';

import React, { useEffect, useRef } from 'react';

interface LeagueThemeProviderProps {
    primaryColor?: string;
    secondaryColor?: string;
    bgColor?: string;
    textColor?: string;
    children: React.ReactNode;
}

export default function LeagueThemeProvider({ primaryColor, secondaryColor, bgColor, textColor, children }: LeagueThemeProviderProps) {
    // Track which vars were set by this provider instance so cleanup is safe
    const setVars = useRef<string[]>([]);

    useEffect(() => {
        const root = document.documentElement;
        const apply = (varName: string, value?: string) => {
            if (value) {
                root.style.setProperty(varName, value);
                if (!setVars.current.includes(varName)) setVars.current.push(varName);
            }
            // Si value es undefined/empty, conservar lo que ya está — no borrar
        };

        apply('--brand-primary', primaryColor);
        apply('--brand-secondary', secondaryColor);
        apply('--brand-bg', bgColor);
        apply('--brand-text', textColor);

    }, [primaryColor, secondaryColor, bgColor, textColor]);

    // Limpiar solo al desmontar, y solo las vars que este provider efectivamente seteó
    useEffect(() => {
        return () => {
            const root = document.documentElement;
            setVars.current.forEach(v => root.style.removeProperty(v));
        };
    }, []);

    return <>{children}</>;
}
