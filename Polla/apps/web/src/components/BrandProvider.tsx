'use client';

import React from 'react';

interface BrandProviderProps {
    pool?: any;
    children: React.ReactNode;
}

export const BrandProvider: React.FC<BrandProviderProps> = ({ pool, children }) => {
    // Detectar si es Enterprise y si está activo (aunque para ver colores quizás solo baste con ser type COMPANY)
    // El usuario dijo: "Cuando un usuario entra a una Polla Empresarial (type: 'COMPANY')..."
    // Asumiremos que si hay colores definidos, se usan.

    // Si la liga no está cargada, no hacemos nada.
    if (!pool) return <>{children}</>;

    const isEnterprise = pool.type === 'COMPANY' || pool.isEnterprise;
    const primary = pool.brandColorPrimary;
    const secondary = pool.brandColorSecondary;

    // Solo aplicar si hay colores y es enterprise
    const style = (isEnterprise && primary) ? {
        '--brand-primary': primary,
        '--brand-secondary': secondary || '#0F172A',
    } as React.CSSProperties : {};

    return (
        <div style={style} className="contents">
            {children}
        </div>
    );
};
