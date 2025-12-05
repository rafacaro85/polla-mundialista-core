"use client";

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface League {
    id: string;
    name: string;
    creator: {
        id: string;
        nickname: string;
        avatarUrl?: string;
    };
}

interface Participant {
    user: {
        id: string;
        nickname: string;
        fullName: string;
        avatarUrl?: string;
    };
}

interface TransferOwnerDialogProps {
    league: League;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function TransferOwnerDialog({ league, open, onOpenChange, onSuccess }: TransferOwnerDialogProps) {
    const [participants, setParticipants] = useState<Participant[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [step, setStep] = useState(1); // 1: Seleccionar, 2: Confirmar
    const [loading, setLoading] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(true);

    useEffect(() => {
        if (open) {
            loadParticipants();
            setStep(1);
            setSelectedUserId('');
        }
    }, [open, league.id]);

    const loadParticipants = async () => {
        try {
            setLoadingParticipants(true);
            const { data } = await api.get(`/leagues/${league.id}/ranking`);
            // Convertir ranking a formato de participantes
            const participantsData = data.map((user: any) => ({
                user: {
                    id: user.id || user.user?.id,
                    nickname: user.nickname || user.user?.nickname,
                    fullName: user.nickname || user.user?.nickname, // Fallback
                    avatarUrl: user.avatarUrl || user.user?.avatarUrl,
                },
            }));
            // Filtrar al dueño actual de la lista
            const filteredParticipants = participantsData.filter((p: Participant) => p.user.id !== league.creator.id);
            setParticipants(filteredParticipants);
        } catch (error) {
            console.error('Error cargando participantes:', error);
            toast.error('No se pudieron cargar los participantes');
        } finally {
            setLoadingParticipants(false);
        }
    };

    const handleTransfer = async () => {
        if (!selectedUserId) return;

        setLoading(true);
        try {
            await api.patch(`/leagues/${league.id}/transfer-owner`, {
                newAdminId: selectedUserId,
            });

            const newAdmin = participants.find(p => p.user.id === selectedUserId);
            toast.success(`Propiedad transferida a ${newAdmin?.user.nickname}`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'No se pudo transferir la propiedad');
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const targetUser = participants.find(p => p.user.id === selectedUserId)?.user;

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.9)', // Fondo más oscuro para enfoque
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110, // Encima de otros modales
            padding: '16px'
        },
        card: {
            backgroundColor: '#1E293B', // Carbon
            width: '100%',
            maxWidth: '380px',
            borderRadius: '24px',
            border: '1px solid #FFC107', // Borde Amarillo (Advertencia)
            boxShadow: '0 0 40px rgba(255, 193, 7, 0.15)',
            display: 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },

        // HEADER ADVERTENCIA
        header: {
            backgroundColor: 'rgba(255, 193, 7, 0.1)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            borderBottom: '1px solid rgba(255, 193, 7, 0.3)',
            textAlign: 'center' as const
        },
        warningIconBox: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#FFC107',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0F172A',
            marginBottom: '12px',
            boxShadow: '0 0 15px rgba(255, 193, 7, 0.4)'
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            color: '#FFC107',
            textTransform: 'uppercase' as const,
            fontSize: '18px',
            letterSpacing: '1px',
            lineHeight: '1.2'
        },
        subtitle: {
            fontSize: '11px',
            color: '#E2E8F0',
            marginTop: '4px',
            maxWidth: '280px'
        },

        // BODY
        body: {
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px'
        },

        // TARJETA DE CAMBIO (Before -> After)
        transferCard: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#0F172A',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid #334155'
        },
        userBox: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '8px',
            width: '80px'
        },
        avatar: {
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: '#1E293B',
            border: '2px solid #475569',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            color: '#94A3B8',
            overflow: 'hidden'
        },
        userName: {
            fontSize: '10px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center' as const,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%'
        },
        arrowBox: {
            color: '#FFC107'
        },

        // SELECTOR
        selectWrapper: {
            position: 'relative' as const
        },
        select: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #475569',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            outline: 'none',
            appearance: 'none' as const,
            cursor: 'pointer'
        },

        // MENSAJE CONFIRMACIÓN
        confirmBox: {
            backgroundColor: 'rgba(255, 193, 7, 0.05)',
            border: '1px dashed #FFC107',
            borderRadius: '12px',
            padding: '16px',
            textAlign: 'center' as const
        },
        confirmText: {
            fontSize: '12px',
            color: '#E2E8F0',
            lineHeight: '1.5'
        },

        // FOOTER
        footer: {
            padding: '20px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px'
        },
        cancelBtn: {
            flex: 1,
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            color: '#94A3B8',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase' as const
        },
        confirmBtn: {
            flex: 2,
            backgroundColor: '#FFC107', // Amarillo Peligro
            border: 'none',
            color: '#0F172A',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: '900',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            cursor: 'pointer',
            textTransform: 'uppercase' as const,
            boxShadow: '0 0 15px rgba(255, 193, 7, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            opacity: selectedUserId ? 1 : 0.5,
            pointerEvents: selectedUserId ? 'auto' : 'none'
        }
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER WARNING */}
                <div style={STYLES.header}>
                    <div style={STYLES.warningIconBox}>
                        <Shield size={24} />
                    </div>
                    <h2 style={STYLES.title}>Transferir Propiedad</h2>
                    <p style={STYLES.subtitle}>
                        Estás a punto de ceder el control total de la liga <strong>"{league.name}"</strong>. Esta acción no se puede deshacer.
                    </p>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {/* Visualización del Cambio */}
                    <div style={STYLES.transferCard}>
                        {/* Dueño Actual */}
                        <div style={STYLES.userBox}>
                            <div style={{ ...STYLES.avatar, borderColor: '#FFC107', color: '#FFC107' }}>
                                {league.creator.avatarUrl ? (
                                    <img src={league.creator.avatarUrl} alt="Owner" className="w-full h-full object-cover" />
                                ) : (
                                    league.creator.nickname.substring(0, 2).toUpperCase()
                                )}
                            </div>
                            <span style={STYLES.userName}>Actual (Tú)</span>
                        </div>

                        <div style={STYLES.arrowBox}>
                            <ArrowRight size={24} />
                        </div>

                        {/* Nuevo Dueño */}
                        <div style={STYLES.userBox}>
                            <div style={{
                                ...STYLES.avatar,
                                backgroundColor: targetUser ? '#00E676' : '#1E293B',
                                borderColor: targetUser ? '#00E676' : '#475569',
                                color: targetUser ? '#0F172A' : '#475569'
                            }}>
                                {targetUser ? (
                                    targetUser.avatarUrl ? (
                                        <img src={targetUser.avatarUrl} alt="New Owner" className="w-full h-full object-cover" />
                                    ) : (
                                        targetUser.nickname.substring(0, 2).toUpperCase()
                                    )
                                ) : '?'}
                            </div>
                            <span style={{ ...STYLES.userName, color: targetUser ? '#00E676' : '#64748B' }}>
                                {targetUser ? targetUser.nickname : 'Nuevo Dueño'}
                            </span>
                        </div>
                    </div>

                    {/* Loading State */}
                    {loadingParticipants && (
                        <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin text-signal" />
                        </div>
                    )}

                    {/* Selector */}
                    {!loadingParticipants && step === 1 && (
                        <div style={STYLES.selectWrapper}>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                style={STYLES.select}
                            >
                                <option value="">Seleccionar participante...</option>
                                {participants.map(p => (
                                    <option key={p.user.id} value={p.user.id}>{p.user.nickname}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Confirmación */}
                    {step === 2 && targetUser && (
                        <div style={STYLES.confirmBox}>
                            <p style={STYLES.confirmText}>
                                Al confirmar, <strong>{targetUser.nickname}</strong> se convertirá en el único administrador y tú pasarás a ser un miembro normal.
                            </p>
                        </div>
                    )}

                </div>

                {/* 3. FOOTER */}
                <div style={STYLES.footer}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        Cancelar
                    </button>

                    {step === 1 ? (
                        <button
                            onClick={() => setStep(2)}
                            style={STYLES.confirmBtn}
                            disabled={!selectedUserId || loadingParticipants}
                        >
                            Continuar
                        </button>
                    ) : (
                        <button
                            onClick={handleTransfer}
                            disabled={loading}
                            style={{ ...STYLES.confirmBtn, backgroundColor: '#FF1744', color: 'white', boxShadow: '0 0 15px rgba(255, 23, 68, 0.4)' }}
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                            CONFIRMAR
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
}
