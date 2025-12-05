'use client';

import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Save, X, Ban, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface UserType {
    id: string;
    email: string;
    fullName: string;
    nickname?: string;
    phoneNumber?: string;
    role: string;
    status?: string;
}

interface EditUserDialogProps {
    user: UserType;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUserUpdated: () => void;
}

/* =============================================================================
   COMPONENTE: MODAL EDITAR USUARIO (TACTICAL STYLE)
   ============================================================================= */
export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {

    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        nickname: '',
        phoneNumber: '',
        role: 'PLAYER',
        status: 'ACTIVE'
    });

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                nickname: user.nickname || '',
                phoneNumber: user.phoneNumber || '',
                role: user.role || 'PLAYER',
                status: user.status || 'ACTIVE'
            });
        }
    }, [user, open]);

    if (!open || !user) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            // Intentamos con PATCH si PUT falla (común en APIs REST)
            await api.patch(`/users/${user.id}`, formData);
            toast.success('Usuario actualizado correctamente');
            onUserUpdated();
            onOpenChange(false);
        } catch (error) {
            console.error('Error updating user:', error);
            toast.error('Error al actualizar usuario');
        } finally {
            setLoading(false);
        }
    };

    // SISTEMA DE DISEÑO BLINDADO
    const STYLES = {
        overlay: {
            position: 'fixed' as const,
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px'
        },
        card: {
            backgroundColor: '#1E293B', // Carbon
            width: '100%',
            maxWidth: '420px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column' as const,
            maxHeight: '90vh',
            overflowY: 'auto' as const,
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },
        // HEADER
        header: {
            padding: '20px 24px',
            borderBottom: '1px solid #334155',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            position: 'sticky' as const,
            top: 0,
            zIndex: 10
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            color: 'white',
            textTransform: 'uppercase' as const,
            fontSize: '18px',
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
        },
        closeBtn: {
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
        },

        // CUERPO
        body: {
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px'
        },

        // AVATAR SECTION
        avatarSection: {
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            marginBottom: '8px'
        },
        avatarCircle: {
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            backgroundColor: '#0F172A',
            border: '2px solid #00E676', // Borde Neón
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#00E676',
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.2)',
            textTransform: 'uppercase' as const
        },
        roleTag: {
            marginTop: '-12px',
            backgroundColor: formData.role === 'SUPER_ADMIN' ? '#FACC15' : '#1E293B',
            color: formData.role === 'SUPER_ADMIN' ? '#0F172A' : '#94A3B8',
            border: '1px solid #334155',
            padding: '2px 10px',
            borderRadius: '12px',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            zIndex: 2
        },

        // INPUTS
        inputGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '6px'
        },
        label: {
            fontSize: '11px',
            color: '#94A3B8',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
        },
        inputWrapper: {
            position: 'relative' as const,
            display: 'flex',
            alignItems: 'center'
        },
        inputIcon: {
            position: 'absolute' as const,
            left: '14px',
            color: '#64748B',
            pointerEvents: 'none' as const
        },
        input: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '12px 16px 12px 40px', // Espacio para el icono
            color: 'white',
            fontSize: '14px',
            outline: 'none',
            transition: 'border-color 0.2s',
            fontWeight: '500'
        },

        // SELECTOR DE ROL (TOGGLE)
        roleSelector: {
            display: 'flex',
            backgroundColor: '#0F172A',
            padding: '4px',
            borderRadius: '12px',
            border: '1px solid #334155',
            marginTop: '8px'
        },
        roleBtn: {
            flex: 1,
            padding: '8px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.2s',
            textTransform: 'uppercase' as const,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px'
        },

        // ZONA DE PELIGRO (Banear)
        dangerZone: {
            marginTop: '12px',
            padding: '16px',
            border: '1px dashed rgba(255, 23, 68, 0.3)',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 23, 68, 0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        },
        dangerText: {
            fontSize: '12px',
            color: '#FF1744',
            fontWeight: 'bold'
        },
        banBtn: {
            backgroundColor: formData.status === 'BANNED' ? '#00E676' : 'rgba(255, 23, 68, 0.1)',
            color: formData.status === 'BANNED' ? '#0F172A' : '#FF1744',
            border: formData.status === 'BANNED' ? 'none' : '1px solid #FF1744',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '10px',
            fontWeight: 'bold',
            cursor: 'pointer',
            textTransform: 'uppercase' as const,
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
        },

        // FOOTER
        footer: {
            padding: '20px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#1E293B',
            position: 'sticky' as const,
            bottom: 0
        },
        cancelBtn: {
            flex: 1,
            backgroundColor: 'transparent',
            border: '1px solid #475569',
            color: '#F8FAFC',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: 'bold',
            fontSize: '12px',
            cursor: 'pointer',
            textTransform: 'uppercase' as const
        },
        saveBtn: {
            flex: 2,
            backgroundColor: '#00E676',
            border: 'none',
            color: '#0F172A',
            padding: '12px',
            borderRadius: '10px',
            fontWeight: '900',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            cursor: 'pointer',
            textTransform: 'uppercase' as const,
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
        }
    };

    // Helper para botones de rol
    const getRoleBtnStyle = (roleName: string) => {
        const isActive = formData.role === roleName;
        return {
            ...STYLES.roleBtn,
            backgroundColor: isActive ? (roleName === 'SUPER_ADMIN' ? '#FACC15' : '#00E676') : 'transparent',
            color: isActive ? '#0F172A' : '#94A3B8',
            boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.3)' : 'none'
        };
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* HEADER */}
                <div style={STYLES.header}>
                    <span style={STYLES.title}>
                        <User size={20} /> Editar Usuario
                    </span>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={24} />
                    </button>
                </div>

                {/* BODY SCROLLABLE */}
                <div style={STYLES.body}>

                    {/* AVATAR */}
                    <div style={STYLES.avatarSection}>
                        <div style={STYLES.avatarCircle}>
                            {formData.fullName.substring(0, 2)}
                        </div>
                        <div style={STYLES.roleTag}>{formData.role}</div>
                    </div>

                    {/* NOMBRE */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Nombre Completo</label>
                        <div style={STYLES.inputWrapper}>
                            <User size={16} style={STYLES.inputIcon} />
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                style={STYLES.input}
                                placeholder="Nombre del usuario"
                            />
                        </div>
                    </div>

                    {/* EMAIL */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Correo Electrónico</label>
                        <div style={STYLES.inputWrapper}>
                            <Mail size={16} style={STYLES.inputIcon} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                style={STYLES.input}
                                placeholder="usuario@email.com"
                            />
                        </div>
                    </div>

                    {/* APODO & TELEFONO */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={STYLES.inputGroup}>
                            <label style={STYLES.label}>Apodo</label>
                            <div style={STYLES.inputWrapper}>
                                <input
                                    type="text"
                                    name="nickname"
                                    value={formData.nickname}
                                    onChange={handleChange}
                                    style={{ ...STYLES.input, paddingLeft: '16px' }}
                                    placeholder="Alias"
                                />
                            </div>
                        </div>
                        <div style={STYLES.inputGroup}>
                            <label style={STYLES.label}>Celular</label>
                            <div style={STYLES.inputWrapper}>
                                <Phone size={16} style={STYLES.inputIcon} />
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    style={STYLES.input}
                                    placeholder="+57..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ROL SELECTOR */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}><Shield size={14} /> Rol de Sistema</label>
                        <div style={STYLES.roleSelector}>
                            <button
                                onClick={() => setFormData({ ...formData, role: 'PLAYER' })}
                                style={getRoleBtnStyle('PLAYER')}
                            >
                                JUGADOR
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                                style={getRoleBtnStyle('ADMIN')}
                            >
                                ADMIN
                            </button>
                            <button
                                onClick={() => setFormData({ ...formData, role: 'SUPER_ADMIN' })}
                                style={getRoleBtnStyle('SUPER_ADMIN')}
                            >
                                SUPER ADMIN
                            </button>
                        </div>
                    </div>

                    {/* ZONA DE PELIGRO */}
                    <div style={STYLES.dangerZone}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <AlertTriangle size={18} color="#FF1744" />
                            <div>
                                <div style={STYLES.dangerText}>Acceso del Usuario</div>
                                <div style={{ fontSize: '10px', color: '#94A3B8' }}>
                                    {formData.status === 'BANNED' ? 'El usuario está bloqueado.' : 'El usuario tiene acceso normal.'}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setFormData({ ...formData, status: formData.status === 'BANNED' ? 'ACTIVE' : 'BANNED' })}
                            style={STYLES.banBtn}
                        >
                            {formData.status === 'BANNED' ? (
                                <><CheckCircle size={14} /> ACTIVAR</>
                            ) : (
                                <><Ban size={14} /> BLOQUEAR</>
                            )}
                        </button>
                    </div>

                </div>

                {/* FOOTER */}
                <div style={STYLES.footer}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={{ ...STYLES.saveBtn, opacity: loading ? 0.7 : 1 }}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={18} /> Guardar Cambios
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
