'use client';

import { useEffect, createContext, useContext } from 'react';

interface BrandThemeProps {
    primaryColor?: string;
    secondaryColor?: string;
    bgColor?: string;
    textColor?: string;
    headingColor?: string;
    barsColor?: string;
    logoUrl?: string;
    companyName?: string;
    children: React.ReactNode;
}

interface BrandContextType {
    brandColorPrimary: string;
    brandColorSecondary: string;
    brandColorBg: string;
    brandColorText: string;
    brandColorHeading: string;
    brandColorBars: string;
    brandingLogoUrl?: string;
    companyName?: string;
}

const BrandContext = createContext<BrandContextType>({
    brandColorPrimary: '#00E676',
    brandColorSecondary: '#1E293B',
    brandColorBg: '#0F172A',
    brandColorText: '#F8FAFC',
    brandColorHeading: '#FFFFFF',
    brandColorBars: '#00E676',
});

export const useBrand = () => useContext(BrandContext);

/**
 * BrandThemeProvider — Inyecta colores corporativos dinámicos como CSS Variables
 */
export default function BrandThemeProvider({
    primaryColor = '#00E676',
    secondaryColor = '#1E293B',
    bgColor = '#0F172A',
    textColor = '#F8FAFC',
    headingColor = '#FFFFFF',
    barsColor = '#00E676',
    logoUrl,
    companyName,
    children
}: BrandThemeProps) {

    useEffect(() => {
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', primaryColor);
        root.style.setProperty('--brand-secondary', secondaryColor);
        root.style.setProperty('--brand-bg', bgColor);
        root.style.setProperty('--brand-text', textColor);
        root.style.setProperty('--brand-heading', headingColor);
        root.style.setProperty('--brand-bars', barsColor);
        root.style.setProperty('--brand-accent', lightenColor(primaryColor, 20));
        if (logoUrl) root.style.setProperty('--brand-logo-url', `url(${logoUrl})`);

        return () => {
            root.style.setProperty('--brand-primary', '#00E676');
            root.style.setProperty('--brand-secondary', '#1E293B');
            root.style.setProperty('--brand-bg', '#0F172A');
            root.style.setProperty('--brand-text', '#F8FAFC');
            root.style.setProperty('--brand-heading', '#FFFFFF');
            root.style.setProperty('--brand-bars', '#00E676');
            root.style.setProperty('--brand-accent', '#00E676');
        };
    }, [primaryColor, secondaryColor, bgColor, textColor, headingColor, barsColor, logoUrl]);

    const brandValue: BrandContextType = {
        brandColorPrimary: primaryColor,
        brandColorSecondary: secondaryColor,
        brandColorBg: bgColor,
        brandColorText: textColor,
        brandColorHeading: headingColor,
        brandColorBars: barsColor,
        brandingLogoUrl: logoUrl,
        companyName,
    };

    return <BrandContext.Provider value={brandValue}>{children}</BrandContext.Provider>;
}

function lightenColor(hex: string, percent: number): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
