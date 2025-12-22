'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { LogOut, Settings, User, ChevronDown } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useBrand } from '@/components/providers/BrandThemeProvider';

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

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';

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

                                    {isAdmin && (
                                        <button
                                            onClick={() => {
                                                setShowMenu(false);
                                                // Check if we have an ID from params, otherwise try to extract from path
                                                const leagueId = params?.id as string || window.location.pathname.split('/')[2];
                                                if (leagueId) {
                                                    router.push(`/leagues/${leagueId}/admin`);
                                                }
                                            }}
                                            className="w-full px-4 py-2 text-left text-sm flex items-center gap-3 transition-colors hover:bg-white/10"
                                            style={{ color: brand.brandColorText }}
                                        >
                                            <Settings size={16} />
                                            Panel de Control
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
