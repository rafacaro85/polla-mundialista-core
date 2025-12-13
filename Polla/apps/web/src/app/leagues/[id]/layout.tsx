'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation'; // Added useRouter just in case
import api from '@/lib/api';
import { LeagueNavigation } from '@/components/LeagueNavigation';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore'; // Ensure user is loaded

// Theme Engine Layout
export default function LeagueLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter(); // For potential redirects
    const { user } = useAppStore();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 1. Fetch League Data (Client Side because we need auth token from cookie implicit in browser or api interceptor)
    useEffect(() => {
        const fetchLeague = async () => {
            if (!params.id) return;
            try {
                // Try fetching specific league details. 
                // Since we don't have a direct /leagues/:id public endpoint documented yet that returns EVERYTHING,
                // we will use the logic we found robust: getMyLeagues or getAll (if admin).

                // OPTIMIZACION: Si ya existe un endpoint de detalle, usarlo.
                // Por ahora, usaremos '/leagues/my' para obtener info básica + roles.
                // Y si es admin, quizas '/leagues/all'.
                // PERO... necesitamos los colores. El fix anterior añadió colores a 'leagues/my'.

                const { data: myLeagues } = await api.get('/leagues/my');
                let found = myLeagues.find((l: any) => l.id === params.id);

                // Fallback for Admins exploring content that is not "theirs" in participation context?
                // If not found in myLeagues, try allLeagues if user is likely an admin.
                if (!found) {
                    // Check if user is Super Admin? 
                    // For now assume standard flow.
                }

                if (found) {
                    setLeague(found);
                } else {
                    console.error("Liga no encontrada o no tienes acceso.");
                    // router.push('/dashboard'); // Optional redirect
                }

            } catch (error) {
                console.error("Error fetching league layout data", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeague();
    }, [params.id]);


    // 2. Loading State (Full Screen Spinner to prevent FOUC)
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#00E676]" size={40} />
            </div>
        );
    }

    if (!league) {
        return (
            <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-white">
                Liga no encontrada o acceso denegado.
            </div>
        );
    }

    // 3. THEME INJECTION
    // Determine colors
    const isEnterprise = (league.type === 'COMPANY' || league.isEnterprise);
    const primary = isEnterprise ? (league.brandColorPrimary || '#00E676') : '#00E676';
    const secondary = isEnterprise ? (league.brandColorSecondary || '#0F172A') : '#0F172A';

    // Derived Colors (color-mix logic moved to inline styles if browser supports, or use CSS variables)
    // We will inject variables and let CSS (global or tailwind) handle usage.

    // NOTE: We map `brand-bg` to `obsidian` variable used in Tailwind config.
    // `brand-primary` to `signal`.
    // `brand-secondary` to `carbon` (surface)? No, secondary is usually background.

    // Let's align with the user request:
    // User requested: --brand-primary, --brand-secondary, --brand-bg, --brand-text
    // And mapped logic: pool.type === 'COMPANY' ? pool.brandColorBg : '#F8FAFC' (User suggested light default, but app is Dark Mode?).
    // App is Dark Mode (#0F172A). I will keep Dark Mode defaults.

    // CSS Variables Injection
    // CSS Variables Injection
    const themeStyles = {
        '--brand-primary': primary,
        // In this app, "Secondary" matches the "Background" usually (#0F172A).
        '--brand-secondary': secondary,
        '--brand-bg': league.brandColorBg || '#0F172A', // NEW
        '--brand-text': league.brandColorText || '#F8FAFC', // NEW

        // Mapping to Tailwind Config Variables
        '--obsidian': league.brandColorBg || secondary, // Map main bg to brand bg
        '--carbon': `color-mix(in srgb, ${league.brandColorBg || secondary}, white 10%)`, // Card Background lightened from secondary
        '--signal': primary, // Accent maps to Brand Primary

        // Borders
        '--border': `color-mix(in srgb, ${league.brandColorBg || secondary}, white 20%)`,
    } as React.CSSProperties;

    return (
        <div
            className="min-h-screen w-full transition-colors duration-500 bg-obsidian text-white flex flex-col md:flex-row"
            style={themeStyles}
        >
            {/* 4. PERSISTENT NAVIGATION (Sidebar/Bottom) - HIDDEN IN STUDIO */}
            {!usePathname()?.includes('/studio') && (
                <LeagueNavigation
                    leagueId={league.id}
                    isAdmin={league.isAdmin || false}
                    isEnterpriseActive={league.isEnterpriseActive || false}
                />
            )}

            {/* 5. MAIN CONTENT AREA */}
            {/* Remove padding if in Studio mode to allow full screen */}
            <main className={`flex-1 w-full ${usePathname()?.includes('/studio') ? '' : 'md:pl-64 pb-24 md:pb-0'}`}>
                {children}
            </main>
        </div>
    );
}
