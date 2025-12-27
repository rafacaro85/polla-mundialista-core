'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useBrand } from '@/components/providers/BrandThemeProvider';
import api from '@/lib/api';

export function LeagueHeader() {
    const router = useRouter();
    const params = useParams();
    const { user, logout } = useAppStore();
    const brand = useBrand();
    const [showMenu, setShowMenu] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const [leagueData, setLeagueData] = useState<{ isLeagueAdmin: boolean; isEnterprise: boolean } | null>(null);

    React.useEffect(() => {
        const checkLeaguePermissions = async () => {
            const leagueId = params?.id as string || window.location.pathname.split('/')[2];
            if (!leagueId || !user) return;

            try {
                // ESTRATEGIA DEFINITIVA: Usar /leagues/my como fuente de verdad
                // Este endpoint ya procesa roles y ownership correctamente en el backend.
                const [myLeaguesRes, metadataRes] = await Promise.all([
                    api.get('/leagues/my'),
                    api.get(`/leagues/${leagueId}/metadata`)
                ]);

                const myLeagues = myLeaguesRes.data || [];
                const metadata = metadataRes.data;

                // Buscar la liga actual en mis ligas
                const currentLeagueInMyList = myLeagues.find((l: any) => l.id === leagueId);

                // Determinar permisos
                const isMyLeagueAdmin = currentLeagueInMyList?.isAdmin === true;
                const isGlobalAdmin = user.role === 'SUPER_ADMIN';

                /* DEBUG LOG */
                if (process.env.NODE_ENV === 'development' || isGlobalAdmin) {
                    console.log('[LeagueHeader] Permission Check (Via /leagues/my):', {
                        leagueId,
                        foundInMyLeagues: !!currentLeagueInMyList,
                        isAdminInMyLeagues: isMyLeagueAdmin,
                        isGlobalAdmin
                    });
                }

                setLeagueData({
                    isLeagueAdmin: isMyLeagueAdmin || isGlobalAdmin,
                    // Usar metadatos para determinar si es empresa, o fallback a lo que diga myLeagues
                    isEnterprise: metadata?.league?.isEnterprise || metadata?.league?.type === 'COMPANY' || currentLeagueInMyList?.isEnterprise
                });
            } catch (error) {
                console.error("Error checking permissions in header", error);
            }
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
                {/* Logo de la Empresa */}
                <div className="flex items-center gap-3">
                    {brand.brandingLogoUrl ? (
                        <img
                            src={brand.brandingLogoUrl}
                            alt={brand.companyName || 'Logo'}
                            className="h-10 w-auto object-contain"
                        />
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

                {/* Avatar & Menu Usuario */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors hover:bg-white/10"
                        style={{ color: brand.brandColorText }}
                    >
                        <div
                            className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                            style={{
                                backgroundColor: brand.brandColorPrimary,
                                color: brand.brandColorBg
                            }}
                        >
                            {user?.nickname?.[0]?.toUpperCase() || user?.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <span className="hidden md:block text-sm font-medium">
                            {user?.nickname || user?.fullName || 'Usuario'}
                        </span>
                        <ChevronDown size={16} className={`transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <>
                            {/* Overlay para cerrar el menú */}
                            <div
                                className="fixed inset-0 z-40"
                                onClick={() => setShowMenu(false)}
                            />

                            {/* Menu */}
                            <div
                                className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl border z-50 overflow-hidden"
                                style={{
                                    backgroundColor: brand.brandColorSecondary,
                                    borderColor: `${brand.brandColorText}20`
                                }}
                            >
                                {/* User Info */}
                                <div
                                    className="px-4 py-3 border-b"
                                    style={{ borderColor: `${brand.brandColorText}20` }}
                                >
                                    <p
                                        className="text-sm font-bold truncate"
                                        style={{ color: brand.brandColorText }}
                                    >
                                        {user?.nickname || user?.fullName}
                                    </p>
                                    <p
                                        className="text-xs truncate opacity-60"
                                        style={{ color: brand.brandColorText }}
                                    >
                                        {user?.email}
                                    </p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <button
                                        onClick={() => {
                                            setShowMenu(false);
                                            router.push('/profile');
                                        }}
                                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors hover:bg-white/10"
                                        style={{ color: brand.brandColorText }}
                                    >
                                        <User size={16} />
                                        Mi Perfil
                                    </button>

                                    {canManageLeague && (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                // Check if we have an ID from params, otherwise try to extract from path
                                                const leagueId = params?.id as string || window.location.pathname.split('/')[2];
                                                if (leagueId) {
                                                    // Route to main admin dashboard
                                                    const targetPath = `/leagues/${leagueId}/admin`;
                                                    router.push(targetPath);
                                                }
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors hover:bg-white/10"
                                            style={{ color: brand.brandColorText }}
                                        >
                                            <Settings size={16} />
                                            {leagueData?.isEnterprise ? 'Panel de Control' : 'Administrar Polla'}
                                        </button>
                                    )}

                                    <div
                                        className="my-2 border-t"
                                        style={{ borderColor: `${brand.brandColorText}20` }}
                                    />

                                    <button
                                        onClick={handleLogout}
                                        className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors hover:bg-red-500/20"
                                        style={{ color: '#ef4444' }}
                                    >
                                        <LogOut size={16} />
                                        Cerrar Sesión
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
