'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useBrand } from '@/components/providers/BrandThemeProvider';
import { useAppStore } from '@/store/useAppStore';
import { UserNav } from '@/components/UserNav';
import api from '@/lib/api';

export function LeagueHeader() {
    const router = useRouter();
    const params = useParams();
    const brand = useBrand();
    const { user } = useAppStore();

    const [leagueData, setLeagueData] = useState<{ isLeagueAdmin: boolean; isEnterprise: boolean } | null>(null);

    React.useEffect(() => {
        const checkLeaguePermissions = async () => {
            const leagueId = params?.id as string || window.location.pathname.split('/')[2];
            if (!leagueId || !user) return;

            // 1. Fetch My Leagues (Reliable for permissions)
            let myLeagues = [];
            try {
                const { data } = await api.get('/leagues/my');
                myLeagues = data || [];
            } catch (err) {
                console.error("Error fetching my leagues in header", err);
            }

            // 2. Fetch Metadata (Optional/Unreliable for permissions but needed for enterprise flag)
            let metadata = null;
            try {
                const { data } = await api.get(`/leagues/${leagueId}/metadata`);
                metadata = data;
            } catch (err) {
                console.warn("Error fetching metadata in header (non-fatal)", err);
            }

            // 3. Determine Permissions
            const currentLeagueInMyList = myLeagues.find((l: any) => l.id === leagueId);
            const isMyLeagueAdmin = currentLeagueInMyList?.isAdmin === true;
            const isGlobalAdmin = user.role === 'SUPER_ADMIN';

            /* DEBUG LOG */
            if (process.env.NODE_ENV === 'development' || isGlobalAdmin) {
                console.log('[LeagueHeader] Permission Check Resilient:', {
                    leagueId,
                    isAdminInMyLeagues: isMyLeagueAdmin,
                    metadataExists: !!metadata,
                    isGlobalAdmin
                });
            }

            setLeagueData({
                isLeagueAdmin: isMyLeagueAdmin || isGlobalAdmin,
                // Enterprise flag fallback priority: Metadata -> MyLeagues
                isEnterprise: metadata?.league?.isEnterprise || metadata?.league?.type === 'COMPANY' || currentLeagueInMyList?.isEnterprise
            });
        };
        checkLeaguePermissions();
    }, [params.id, user, window.location.pathname]);

    // Use fetched permission, fall back to global role check for safety or initial render
    const canManageLeague = leagueData?.isLeagueAdmin || user?.role === 'SUPER_ADMIN';

    return (
        <header
            className="sticky top-0 z-50 border-b backdrop-blur-md"
            style={{
                backgroundColor: `${brand.brandColorBg}f0`, // f0 = 94% opacity
                borderColor: `${brand.brandColorText}20` // 20 = 12% opacity
            }}
        >
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                {/* Botón Volver y Logo */}
                <div className="flex items-center gap-4">
                    {typeof window !== 'undefined' && window.location.pathname !== '/dashboard' && (
                        <button
                            onClick={() => router.push('/dashboard')}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1E293B] hover:bg-[#334155] border border-white/10 text-white transition-all group shadow-lg"
                        >
                            <ChevronDown size={16} className="rotate-90 text-[var(--brand-primary,#00E676)] group-hover:-translate-x-1 transition-transform" />
                            <span className="text-[10px] font-black uppercase tracking-widest">VOLVER</span>
                        </button>
                    )}

                    {brand.brandingLogoUrl ? (
                        <div className="h-10 w-auto p-1 bg-white rounded-md overflow-hidden flex items-center justify-center">
                            <img
                                src={brand.brandingLogoUrl}
                                alt={brand.companyName || 'Logo'}
                                className="h-full w-auto object-contain"
                            />
                        </div>
                    ) : (
                        <div
                            className="h-10 px-4 rounded-lg flex items-center justify-center font-bold text-sm"
                            style={{
                                backgroundColor: brand.brandColorPrimary,
                                color: brand.brandColorBg
                            }}
                        >
                            {brand.companyName || 'POLLA'}
                        </div>
                    )}
                </div>

                {/* Avatar & Menu Usuario (Restaurado estándar) */}
                <UserNav />
            </div>
        </header>
    );
}
