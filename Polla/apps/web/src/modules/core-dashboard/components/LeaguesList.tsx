import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, ArrowRight, Settings, Briefcase, Trophy } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { CreateLeagueDialog } from '@/components/CreateLeagueDialog';
import { CreateBusinessLeagueDialog } from '@/components/CreateBusinessLeagueDialog';
import { JoinLeagueDialog } from '@/components/JoinLeagueDialog';
import { LeagueSettings as AdminLeagueSettings } from '@/components/AdminLeagueSettings';

// --- INTERFACES ---
interface League {
    id: string;
    name: string;
    members: number;
    admin: string;
    isAdmin: boolean;
    initial: string;
    code: string;
    maxParticipants: number;
    participantCount?: number;
    type?: string;
    isEnterprise?: boolean;
    isEnterpriseActive?: boolean;
    isPaid?: boolean;
}

/* =============================================================================
   COMPONENTE: LEAGUES LIST (ESTILO TACTICAL CON TABS)
   ============================================================================= */
export const LeaguesList = ({ initialTab = 'social' }: { initialTab?: 'social' | 'enterprise' }) => {
    const router = useRouter();
    const { user } = useAppStore();
    const [leagues, setLeagues] = React.useState<League[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [activeTab, setActiveTab] = useState<'social' | 'enterprise'>(initialTab);

    React.useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    const fetchLeagues = React.useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/leagues/my');

            // Mapear datos de la API a la interfaz local
            const mappedLeagues = data.map((l: any) => ({
                id: l.id,
                name: l.name,
                members: l.participantCount || 0,
                admin: l.isAdmin ? 'Tú' : (l.admin?.nickname || 'Admin'),
                isAdmin: l.isAdmin,
                initial: l.name.charAt(0).toUpperCase(),
                code: l.code, // Necesario para LeagueSettings
                maxParticipants: l.maxParticipants, // Necesario para LeagueSettings
                type: l.type,
                isEnterprise: l.isEnterprise,
                isEnterpriseActive: l.isEnterpriseActive,
                isPaid: l.isPaid
            }));

            // Auto-switch tab si solo tiene ligas de empresa
            const hasSocial = mappedLeagues.some((l: any) => !l.isEnterprise);
            const hasEnterprise = mappedLeagues.some((l: any) => l.isEnterprise);

            // Lógica opcional: Solo auto-switch si NO se especificó initialTab explícitamente desde fuera
            // o si estamos en el montaje inicial sin prop forzada.
            // Para simplificar y respetar el click del usuario:
            if (!hasSocial && hasEnterprise && initialTab === 'social') {
                // Solo si el usuario pidió social por defecto pero no hay, y sí hay enterprise, podríamos cambiar.
                // Pero si el usuario hizo clic explícito en "Social", quizás quiera ver vacío.
                // setActiveTab('enterprise'); 
            }

            setLeagues(mappedLeagues);
        } catch (error) {
            console.error('Error cargando ligas', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchLeagues();
    }, [fetchLeagues]);

    // FILTROS
    const socialLeagues = leagues.filter(l => !l.isEnterprise);
    const enterpriseLeagues = leagues.filter(l => l.isEnterprise);

    // Lista a mostrar según tab
    const displayLeagues = activeTab === 'social' ? socialLeagues : enterpriseLeagues;

    // ESTILOS EN LÍNEA (BLINDADOS)
    const STYLES = {
        container: {
            padding: '16px',
            paddingBottom: '100px', // Espacio para el menú inferior
            backgroundColor: '#0F172A',
            minHeight: '100vh',
            fontFamily: 'sans-serif'
        },
        header: {
            marginBottom: '24px'
        },
        titleRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '24px',
            color: 'white',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            lineHeight: '1.1'
        },
        subtitle: {
            fontSize: '11px',
            color: '#94A3B8', // Tactical Grey
            marginTop: '4px',
            fontWeight: '600'
        },
        // TABS TOGGLE
        toggleContainer: {
            display: 'flex',
            backgroundColor: '#1E293B',
            borderRadius: '12px',
            padding: '4px',
            marginBottom: '24px',
            border: '1px solid #334155'
        },
        tabBtn: (isActive: boolean) => ({
            flex: 1,
            padding: '10px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isActive ? '#00E676' : 'transparent',
            color: isActive ? '#0F172A' : '#94A3B8',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
        }),
        // Botones de acción
        actionRow: {
            display: 'flex',
            gap: '12px',
            marginBottom: '24px'
        },
        createButton: {
            flex: 1,
            backgroundColor: activeTab === 'social' ? '#00E676' : '#0072FF', // Verde Social, Azul Enterprise
            color: activeTab === 'social' ? '#0F172A' : 'white',
            border: 'none',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: '900',
            fontSize: '11px',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            boxShadow: activeTab === 'social' ? '0 4px 15px rgba(0, 230, 118, 0.3)' : '0 4px 15px rgba(0, 114, 255, 0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
        },
        outlineButton: {
            flex: 1,
            backgroundColor: 'transparent',
            border: activeTab === 'social' ? '1px solid #00E676' : '1px solid #0072FF',
            color: activeTab === 'social' ? '#00E676' : '#0072FF',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: '900',
            fontSize: '11px',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
        },
        // Grid de Tarjetas
        grid: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '12px'
        },
        // Tarjeta de Liga
        card: {
            backgroundColor: '#1E293B', // Carbon
            border: '1px solid #334155',
            borderRadius: '16px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            position: 'relative' as const,
            overflow: 'hidden',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        },
        iconBox: {
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#0F172A', // Obsidian
            border: '1px solid #334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
        },
        iconText: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '20px',
            color: '#94A3B8'
        },
        infoBox: {
            flex: 1,
            minWidth: 0 // Para que el truncate funcione
        },
        leagueName: {
            fontFamily: "'Russo One', sans-serif",
            fontSize: '16px',
            color: 'white',
            marginBottom: '4px',
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis'
        },
        metaData: {
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10px',
            color: '#94A3B8',
            fontWeight: '600'
        },
        // Botón de Acción en la tarjeta
        actionBtn: {
            height: '32px',
            padding: '0 12px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: '800',
            textTransform: 'uppercase' as const,
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }
    };

    return (
        <div style={STYLES.container}>

            {/* 1. HEADER SECCIÓN */}
            <div style={STYLES.header}>
                <div style={STYLES.titleRow}>
                    <div>
                        <h2 style={STYLES.title}>Mis Pollas</h2>
                        <p style={STYLES.subtitle}>GESTIONA TUS TORNEOS</p>
                    </div>
                </div>

                {/* TOGGLE TABS */}
                <div style={STYLES.toggleContainer}>
                    <button
                        style={STYLES.tabBtn(activeTab === 'social')}
                        onClick={() => setActiveTab('social')}
                    >
                        <Trophy size={14} /> Sociales
                    </button>
                    <button
                        style={STYLES.tabBtn(activeTab === 'enterprise')}
                        onClick={() => setActiveTab('enterprise')}
                    >
                        <Briefcase size={14} /> Empresas
                    </button>
                </div>

                {/* BOTONES DE ACCIÓN (DINÁMICOS) */}
                <div style={STYLES.actionRow}>
                    {activeTab === 'social' ? (
                        <>
                            <CreateLeagueDialog onLeagueCreated={fetchLeagues}>
                                <button style={STYLES.createButton}>
                                    + CREAR POLLA
                                </button>
                            </CreateLeagueDialog>
                            <JoinLeagueDialog onLeagueJoined={fetchLeagues}>
                                <button style={STYLES.outlineButton}>
                                    UNIRSE CON CÓDIGO
                                </button>
                            </JoinLeagueDialog>
                        </>
                    ) : (
                        <>
                            <CreateBusinessLeagueDialog onLeagueCreated={fetchLeagues}>
                                <button style={STYLES.createButton}>
                                    + CREAR EMPRESA
                                </button>
                            </CreateBusinessLeagueDialog>
                            <JoinLeagueDialog onLeagueJoined={fetchLeagues}>
                                <button style={STYLES.outlineButton}>
                                    UNIRSE CON CÓDIGO
                                </button>
                            </JoinLeagueDialog>
                        </>
                    )}
                </div>
            </div>

            {/* 2. LISTA DE LIGAS FILTRADA */}
            <div style={STYLES.grid}>
                {displayLeagues.map((league) => (
                    <div key={league.id} style={STYLES.card}>

                        {/* Indicador lateral */}
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                            backgroundColor: league.isEnterprise ? '#0072FF' : (league.isAdmin ? '#00E676' : '#334155')
                        }} />

                        {/* Icono / Inicial */}
                        <div style={STYLES.iconBox}>
                            <span style={{ ...STYLES.iconText, color: league.isEnterprise ? '#0072FF' : (league.isAdmin ? '#00E676' : '#94A3B8') }}>
                                {league.isEnterprise ? <Briefcase size={20} /> : league.initial}
                            </span>
                        </div>

                        {/* Información */}
                        <div style={STYLES.infoBox}>
                            <h3 style={STYLES.leagueName}>{league.name}</h3>
                            <div style={STYLES.metaData}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Users size={10} /> {league.members}
                                </span>
                                <span>•</span>
                                <span>Admin: <span style={{ color: 'white' }}>{league.admin}</span></span>
                                {league.isEnterprise && !league.isEnterpriseActive && (
                                    <span style={{ color: '#F97316', marginLeft: '4px' }}>• BORRADOR</span>
                                )}
                            </div>
                        </div>

                        <div>
                            {league.isAdmin && league.isEnterpriseActive ? (
                                // CASO 1: Empresa Activa (Admin)
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => router.push(`/leagues/${league.id}/admin`)}
                                        style={{
                                            ...STYLES.actionBtn,
                                            width: '32px',
                                            padding: 0,
                                            backgroundColor: '#334155',
                                            color: '#94A3B8'
                                        }}
                                        title="Configuración"
                                    >
                                        <Settings size={14} />
                                    </button>
                                    <button
                                        onClick={() => router.push(`/leagues/${league.id}`)}
                                        style={{
                                            ...STYLES.actionBtn,
                                            backgroundColor: '#0072FF',
                                            color: 'white',
                                            boxShadow: '0 0 10px rgba(0,114,255,0.4)'
                                        }}
                                    >
                                        INGRESAR
                                    </button>
                                </div>
                            ) : league.isAdmin && league.isEnterprise && !league.isEnterpriseActive ? (
                                // CASO 2: Empresa Borrador (Admin) -> Ir a Studio
                                <button
                                    onClick={() => router.push(`/leagues/${league.id}/studio`)}
                                    style={{
                                        ...STYLES.actionBtn,
                                        backgroundColor: '#F97316',
                                        color: 'white'
                                    }}
                                >
                                    DISEÑAR
                                </button>
                            ) : !league.isAdmin ? (
                                // CASO 3: Participante -> Jugar
                                <button
                                    onClick={() => router.push(`/leagues/${league.id}`)}
                                    style={{
                                        ...STYLES.actionBtn,
                                        backgroundColor: 'transparent',
                                        border: '1px solid #475569',
                                        color: 'white'
                                    }}
                                >
                                    JUGAR
                                </button>
                            ) : (
                                // CASO 4: Admin Polla Social
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={() => router.push(`/leagues/${league.id}/admin`)}
                                        style={{
                                            ...STYLES.actionBtn,
                                            width: '32px',
                                            padding: 0,
                                            backgroundColor: '#334155',
                                            color: '#94A3B8'
                                        }}
                                        title="Configuración"
                                    >
                                        <Settings size={14} />
                                    </button>

                                    {!league.isPaid ? (
                                        <button
                                            style={{
                                                ...STYLES.actionBtn,
                                                backgroundColor: 'rgba(234, 179, 8, 0.2)', // Yellow transparent
                                                color: '#FACC15',
                                                border: '1px solid #FACC15',
                                                cursor: 'not-allowed'
                                            }}
                                        >
                                            PENDIENTE
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => router.push(`/leagues/${league.id}`)}
                                            style={{
                                                ...STYLES.actionBtn,
                                                backgroundColor: '#00E676',
                                                color: '#0F172A',
                                                boxShadow: '0 0 10px rgba(0,230,118,0.2)'
                                            }}
                                        >
                                            INGRESAR
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                    </div>
                ))}
            </div>

            {/* Empty State */}
            {
                !loading && displayLeagues.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>
                        <Shield size={48} style={{ margin: '0 auto 16px', color: '#334155' }} />
                        <p style={{ color: '#94A3B8', fontSize: '12px' }}>
                            No tienes pollas {activeTab === 'social' ? 'sociales' : 'empresariales'} aún.
                        </p>
                    </div>
                )
            }

        </div >
    );
};
