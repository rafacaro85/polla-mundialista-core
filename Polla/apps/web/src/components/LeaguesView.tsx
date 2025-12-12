import React from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Users, ArrowRight, Settings } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import api from '@/lib/api';
import { CreateLeagueDialog } from './CreateLeagueDialog';
import { JoinLeagueDialog } from './JoinLeagueDialog';
import { LeagueSettings as AdminLeagueSettings } from './AdminLeagueSettings';

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
}

/* =============================================================================
   COMPONENTE: LEAGUES VIEW (ESTILO TACTICAL)
   ============================================================================= */
export const LeaguesView = () => {
    const router = useRouter();
    const { user } = useAppStore();
    const [leagues, setLeagues] = React.useState<League[]>([]);
    const [loading, setLoading] = React.useState(true);

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
                isEnterpriseActive: l.isEnterpriseActive
            }));

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

    const draftLeagues = leagues.filter(l => l.isEnterprise && !l.isEnterpriseActive && l.isAdmin);

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
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
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
        createButton: {
            backgroundColor: '#00E676', // Signal Green
            color: '#0F172A',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '8px',
            fontWeight: '900',
            fontSize: '10px',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.3)',
            cursor: 'pointer'
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
        roleBadge: {
            fontSize: '9px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            marginLeft: 'auto' // Empuja a la derecha si se usa flex
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
                <div>
                    <h2 style={STYLES.title}>Mis Pollas</h2>
                    <p style={STYLES.subtitle}>GESTIONA TUS TORNEOS PRIVADOS</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                    <CreateLeagueDialog onLeagueCreated={fetchLeagues}>
                        <button style={STYLES.createButton}>
                            + CREAR POLLA
                        </button>
                    </CreateLeagueDialog>
                    <JoinLeagueDialog onLeagueJoined={fetchLeagues}>
                        <button style={{
                            ...STYLES.createButton,
                            backgroundColor: 'transparent',
                            border: '1px solid #00E676',
                            color: '#00E676',
                            boxShadow: 'none',
                            fontSize: '9px',
                            padding: '6px 12px'
                        }}>
                            UNIRSE CON CÓDIGO
                        </button>
                    </JoinLeagueDialog>
                </div>
            </div>

            {/* 1.5. BORRADORES EMPRESARIALES */}
            {draftLeagues.map(l => (
                <div key={l.id} style={{
                    background: 'linear-gradient(90deg, rgba(249, 115, 22, 0.1) 0%, rgba(15, 23, 42, 0) 100%)',
                    border: '1px solid rgba(249, 115, 22, 0.3)',
                    borderRadius: '12px',
                    padding: '16px',
                    marginBottom: '24px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <div style={{ width: '8px', height: '8px', backgroundColor: '#F97316', borderRadius: '50%' }}></div>
                            <span style={{ color: '#F97316', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Borrador Empresarial
                            </span>
                        </div>
                        <h3 style={{ ...STYLES.leagueName, fontSize: '18px', marginBottom: '4px' }}>{l.name}</h3>
                        <p style={{ color: '#94A3B8', fontSize: '11px' }}>Personaliza tu marca y activa tu plan.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                        <button
                            onClick={() => router.push(`/leagues/${l.id}/studio`)}
                            style={{
                                backgroundColor: '#F97316',
                                color: 'white',
                                padding: '8px 16px',
                                borderRadius: '8px',
                                fontWeight: 'bold',
                                fontSize: '11px',
                                textTransform: 'uppercase',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            Ir al Studio &rarr;
                        </button>
                    </div>
                </div>
            ))}

            {/* 2. LISTA DE LIGAS */}
            <div style={STYLES.grid}>
                {leagues.map((league) => (
                    <div key={league.id} style={STYLES.card}>

                        {/* Indicador lateral de Admin (Verde) o Miembro (Gris) */}
                        <div style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px',
                            backgroundColor: league.isAdmin ? '#00E676' : '#334155'
                        }} />

                        {/* Icono / Inicial */}
                        <div style={STYLES.iconBox}>
                            <span style={{ ...STYLES.iconText, color: league.isAdmin ? '#00E676' : '#94A3B8' }}>
                                {league.initial}
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
                            </div>
                        </div>

                        <div>
                            <AdminLeagueSettings
                                league={league as any}
                                onUpdate={fetchLeagues}
                                trigger={
                                    <button style={
                                        league.isAdmin ? {
                                            ...STYLES.actionBtn,
                                            backgroundColor: '#00E676',
                                            color: '#0F172A',
                                            boxShadow: '0 0 10px rgba(0,230,118,0.2)'
                                        } : {
                                            ...STYLES.actionBtn,
                                            backgroundColor: 'transparent',
                                            border: '1px solid #475569',
                                            color: 'white'
                                        }
                                    }>
                                        {league.isAdmin ? 'GESTIONAR' : 'VER'}
                                    </button>
                                }
                            />
                        </div>

                    </div>
                ))}
            </div>

            {/* Empty State (Opcional, si no hay ligas) */}
            {
                !loading && leagues.length === 0 && (
                    <div style={{ textAlign: 'center', marginTop: '40px', opacity: 0.5 }}>
                        <Shield size={48} style={{ margin: '0 auto 16px', color: '#334155' }} />
                        <p style={{ color: '#94A3B8', fontSize: '12px' }}>No perteneces a ninguna liga aún.</p>
                    </div>
                )
            }

        </div >
    );
};
