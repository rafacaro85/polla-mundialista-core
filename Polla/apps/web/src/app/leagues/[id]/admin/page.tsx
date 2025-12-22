'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Palette,
    Users,
    Star,
    FileBarChart2,
    Settings,
    TrendingUp,
    Shield,
    ChevronRight
} from 'lucide-react';
import api from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

interface DashboardCardProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    href?: string;
    stat?: string;
    onClick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'default';
}

const DashboardCard = ({
    icon,
    title,
    description,
    href,
    stat,
    onClick,
    disabled = false,
    variant = 'default'
}: DashboardCardProps) => {
    const router = useRouter();

    const handleClick = () => {
        if (disabled) return;
        if (onClick) {
            onClick();
        } else if (href) {
            router.push(href);
        }
    };

    const isPrimary = variant === 'primary';

    return (
        <button
            onClick={handleClick}
            disabled={disabled}
            className={`
                group relative overflow-hidden
                bg-brand-secondary border-2 rounded-2xl p-6
                transition-all duration-300
                ${disabled
                    ? 'opacity-50 cursor-not-allowed border-slate-700'
                    : 'hover:border-brand-primary hover:bg-white/5 cursor-pointer border-slate-700/50'
                }
                ${isPrimary ? 'border-brand-primary shadow-[0_0_20px_rgba(0,230,118,0.15)]' : ''}
            `}
        >
            {/* Glow effect on hover */}
            {!disabled && (
                <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/0 via-brand-primary/0 to-brand-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            )}

            {/* Content */}
            <div className="relative z-10 flex flex-col h-full">
                {/* Icon & Stat */}
                <div className="flex items-start justify-between mb-4">
                    <div className={`
                        p-3 rounded-xl transition-all duration-300
                        ${isPrimary
                            ? 'bg-brand-primary/20 text-brand-primary'
                            : 'bg-brand-primary/10 text-brand-primary group-hover:bg-brand-primary/20'
                        }
                    `}>
                        {icon}
                    </div>
                    {stat && (
                        <div className="text-xs font-bold text-brand-primary bg-brand-primary/10 px-3 py-1 rounded-full">
                            {stat}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-brand-text mb-2 text-left">
                    {title}
                </h3>

                {/* Description */}
                <p className="text-sm text-slate-400 mb-4 flex-1 text-left">
                    {description}
                </p>

                {/* Action indicator */}
                {!disabled && (
                    <div className="flex items-center gap-2 text-xs font-bold text-brand-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Acceder</span>
                        <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                )}

                {disabled && (
                    <div className="text-xs font-bold text-slate-500">
                        Próximamente
                    </div>
                )}
            </div>
        </button>
    );
};

export default function AdminDashboardPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAppStore();
    const [league, setLeague] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeague = async () => {
            try {
                // GOD MODE: Super Admins can access ANY league
                const isSuperAdmin = user?.role === 'SUPER_ADMIN';

                if (isSuperAdmin) {
                    // Super Admin: Fetch league directly without membership check
                    try {
                        const { data: leagueData } = await api.get(`/leagues/${params.id}`);
                        setLeague({
                            ...leagueData,
                            isAdmin: true, // Grant admin privileges
                            isSuperAdminAccess: true, // Flag for UI
                        });
                    } catch (error) {
                        console.error('Error loading league:', error);
                        router.push('/admin/leagues');
                    }
                } else {
                    // Regular user: Fetch specific league and check admin status
                    const { data: leagueData } = await api.get(`/leagues/${params.id}`);

                    if (!leagueData) {
                        router.push('/dashboard');
                        return;
                    }

                    // Check if user is admin of this league
                    if (!leagueData.isAdmin) {
                        router.push(`/leagues/${params.id}`);
                        return;
                    }

                    setLeague(leagueData);
                }
            } catch (error) {
                console.error('Error loading league:', error);
                router.push('/dashboard');
            } finally {
                setLoading(false);
            }
        };

        fetchLeague();
    }, [params.id, router, user]);

    if (loading) {
        return (
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent" />
            </div>
        );
    }

    if (!league) {
        return null;
    }

    const modules = [
        {
            icon: <Palette size={24} />,
            title: 'Diseño & Marca',
            description: 'Personaliza colores, logos y textos de la interfaz corporativa',
            href: `/leagues/${params.id}/studio`,
            variant: 'primary' as const,
        },
        {
            icon: <Users size={24} />,
            title: 'Participantes',
            description: 'Gestiona usuarios, aprueba accesos e invita empleados',
            href: `/leagues/${params.id}/admin/users`,
            stat: league.participantCount ? `${league.participantCount} activos` : undefined,
        },
        {
            icon: <Star size={24} />,
            title: 'Preguntas Bonus',
            description: 'Crea preguntas personalizadas para tu empresa',
            href: `/leagues/${params.id}/admin/bonus`,
        },
        {
            icon: <TrendingUp size={24} />,
            title: 'Analítica',
            description: 'Visualiza estadísticas de participación y engagement',
            href: `/leagues/${params.id}/admin/analytics`,
            disabled: !league.isEnterpriseActive,
        },
        {
            icon: <FileBarChart2 size={24} />,
            title: 'Exportar Datos',
            description: 'Descarga el ranking y predicciones en formato Excel',
            onClick: () => {
                // TODO: Implement export functionality
                alert('Función de exportación en desarrollo');
            },
            disabled: true,
        },
        {
            icon: <Settings size={24} />,
            title: 'Configuración',
            description: 'Ajusta límites, códigos de acceso y permisos',
            href: `/leagues/${params.id}/admin/settings`,
        },
    ];

    return (
        <div className="min-h-screen bg-brand-bg text-brand-text">
            <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
                {/* Header */}
                <div className="mb-8">
                    {/* Back Button */}
                    <button
                        onClick={() => router.push(`/leagues/${params.id}`)}
                        className="flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-brand-primary transition-colors mb-6 group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Volver a la Polla
                    </button>

                    {/* Title & Subtitle */}
                    <div className="flex items-start justify-between flex-wrap gap-4">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-brand-text mb-2 flex items-center gap-3">
                                <Shield className="text-brand-primary" size={32} />
                                Panel de Control
                            </h1>
                            <p className="text-slate-400 text-sm md:text-base">
                                {league.companyName || league.name}
                            </p>
                        </div>

                        {/* Admin Badge */}
                        <div className="flex flex-col md:flex-row gap-2">
                            {league.isSuperAdminAccess && (
                                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-600/20 to-orange-600/20 border border-amber-500/50 rounded-full">
                                    <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                                        🛠️ God Mode
                                    </span>
                                </div>
                            )}
                            <div className="flex items-center gap-2 px-4 py-2 bg-brand-primary/10 border border-brand-primary/30 rounded-full">
                                <div className="w-2 h-2 bg-brand-primary rounded-full animate-pulse" />
                                <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                                    Administrador
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Dashboard Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {modules.map((module, index) => (
                        <DashboardCard
                            key={index}
                            icon={module.icon}
                            title={module.title}
                            description={module.description}
                            href={module.href}
                            stat={module.stat}
                            onClick={module.onClick}
                            disabled={module.disabled}
                            variant={module.variant}
                        />
                    ))}
                </div>

                {/* Help Section */}
                <div className="mt-12 p-6 bg-brand-secondary border border-slate-700/50 rounded-2xl">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-500/10 rounded-xl">
                            <Shield className="text-blue-400" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-brand-text mb-2">
                                ¿Necesitas ayuda?
                            </h3>
                            <p className="text-sm text-slate-400 mb-4">
                                Si tienes dudas sobre cómo gestionar tu polla empresarial, contáctanos.
                            </p>
                            <button className="text-sm font-bold text-brand-primary hover:underline">
                                Contactar Soporte →
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
