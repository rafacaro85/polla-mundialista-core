'use client';

import { useEffect, createContext, useContext } from 'react';

interface BrandThemeProps {
    primaryColor?: string;
    secondaryColor?: string;
    bgColor?: string;
    textColor?: string;
    logoUrl?: string;
    companyName?: string;
    children: React.ReactNode;
}

interface BrandContextType {
    brandColorPrimary: string;
    brandColorSecondary: string;
    brandColorBg: string;
    brandColorText: string;
    brandingLogoUrl?: string;
    companyName?: string;
}

const BrandContext = createContext<BrandContextType>({
    brandColorPrimary: '#00E676',
    brandColorSecondary: '#1E293B',
    brandColorBg: '#0F172A',
    brandColorText: '#F8FAFC',
});

export const useBrand = () => useContext(BrandContext);

/**
 * BrandThemeProvider - Inyecta colores corporativos dinámicos
 * 
 * Este componente lee la configuración de branding de una empresa
 * y aplica sus colores en toda la interfaz mediante CSS Variables.
 * 
 * Uso:
 * <BrandThemeProvider 
 *   primaryColor="#FF0000" 
 *   secondaryColor="#1E293B"
 *   bgColor="#0F172A"
 *   textColor="#F8FAFC"
 *   companyName="Mi Empresa"
 * >
 *   {children}
 * </BrandThemeProvider>
 */
export default function BrandThemeProvider({
    primaryColor = '#00E676',    // Verde Default (Marca original)
    secondaryColor = '#1E293B',  // Carbon Default
    bgColor = '#0F172A',         // Obsidian Default
    textColor = '#F8FAFC',       // Texto claro Default
    logoUrl,
    companyName,
    children
}: BrandThemeProps) {

    useEffect(() => {
        const root = document.documentElement;

        // Inyectar colores en variables CSS del :root
        root.style.setProperty('--brand-primary', primaryColor);
        root.style.setProperty('--brand-secondary', secondaryColor);
        root.style.setProperty('--brand-bg', bgColor);
        root.style.setProperty('--brand-text', textColor);

        // Calcular color de acento (20% más claro que el primario)
        const accentColor = lightenColor(primaryColor, 20);
        root.style.setProperty('--brand-accent', accentColor);

        // Opcional: Guardar logo URL en variable CSS si se necesita
        if (logoUrl) {
            root.style.setProperty('--brand-logo-url', `url(${logoUrl})`);
        }

        // Cleanup: Restaurar valores por defecto al desmontar
        return () => {
            root.style.setProperty('--brand-primary', '#00E676');
            root.style.setProperty('--brand-secondary', '#1E293B');
            root.style.setProperty('--brand-bg', '#0F172A');
            root.style.setProperty('--brand-text', '#F8FAFC');
            root.style.setProperty('--brand-accent', '#00E676');
        };
    }, [primaryColor, secondaryColor, bgColor, textColor, logoUrl]);

    const brandValue: BrandContextType = {
        brandColorPrimary: primaryColor,
        brandColorSecondary: secondaryColor,
        brandColorBg: bgColor,
        brandColorText: textColor,
        brandingLogoUrl: logoUrl,
        companyName,
    };

    return <BrandContext.Provider value={brandValue}>{children}</BrandContext.Provider>;
}

/**
 * Función auxiliar para aclarar un color hexadecimal
 * @param hex - Color en formato #RRGGBB
 * @param percent - Porcentaje de aclarado (0-100)
 */
function lightenColor(hex: string, percent: number): string {
    // Remover # si existe
    hex = hex.replace('#', '');

    // Convertir a RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Aclarar cada componente
    const newR = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
    const newG = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
    const newB = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));

    // Convertir de vuelta a hex
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
}
