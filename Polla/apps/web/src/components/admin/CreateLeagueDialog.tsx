"use client";

import React, { useState } from 'react';
import { Trophy, Users, Save, X, Loader2, Lock, Globe, Crown } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface CreateLeagueDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

export function CreateLeagueDialog({ open, onOpenChange, onSuccess }: CreateLeagueDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<{
        name: string;
        type: string;
        maxParticipants: number | string;
        accessCodePrefix: string;
    }>({
        name: '',
        type: 'LIBRE', // LIBRE (Public), VIP
        maxParticipants: 50,
        accessCodePrefix: ''
    });

    if (!open) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'maxParticipants' ? (value === '' ? '' : parseInt(value)) : value
        }));
    };

    const handleTypeSelect = (type: string) => {
        let max = 50;
        if (type === 'VIP') max = 5;
        setFormData(prev => ({ ...prev, type, maxParticipants: max }));
    };

    const generateCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre de la liga es obligatorio');
            return;
        }

        const max = typeof formData.maxParticipants === 'string' ? parseInt(formData.maxParticipants) || 0 : formData.maxParticipants;

        if (max < 2) {
            toast.error('El límite debe ser al menos 2 participantes');
            return;
        }

        if (formData.type === 'VIP' && max > 5) {
            toast.error('Las ligas VIP tienen un máximo de 5 participantes');
            return;
        }

        setLoading(true);
        try {
            // Generate a code if not present (though we send it)
            const payload = {
                ...formData,
                accessCodePrefix: generateCode()
            };

            await api.post('/leagues', payload);
            toast.success('¡Liga creada exitosamente!');
            onSuccess();
            onOpenChange(false);
            // Reset form
            setFormData({ name: '', type: 'LIBRE', maxParticipants: 50, accessCodePrefix: '' });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || 'No se pudo crear la liga');
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
            maxWidth: '500px',
            borderRadius: '24px',
            border: '1px solid #334155',
            boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column' as const,
            overflow: 'hidden',
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },

        // HEADER
        header: {
            padding: '24px',
            borderBottom: '1px solid #334155',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
        },
        iconBox: {
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            backgroundColor: '#0F172A',
            border: '1px solid #00E676',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E676'
        },
        titleBox: {
            flex: 1
        },
        title: {
            fontFamily: "'Russo One', sans-serif",
            color: 'white',
            textTransform: 'uppercase' as const,
            fontSize: '18px',
            lineHeight: '1.2'
        },
        subtitle: {
            fontSize: '11px',
            color: '#94A3B8',
            marginTop: '2px'
        },
        closeBtn: {
            background: 'transparent',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '4px'
        },

        // BODY
        body: {
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '24px'
        },

        // INPUTS
        inputGroup: {
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '8px'
        },
        label: {
            fontSize: '11px',
            fontWeight: 'bold',
            color: '#94A3B8',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        inputWrapper: {
            position: 'relative' as const,
            display: 'flex',
            alignItems: 'center'
        },
        input: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            outline: 'none',
            fontFamily: 'sans-serif'
        },
        inputIcon: {
            position: 'absolute' as const,
            right: '16px',
            color: '#64748B'
        },

        // TYPE SELECTOR
        typeGrid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '12px'
        },
        typeCard: (isActive: boolean) => ({
            backgroundColor: isActive ? 'rgba(0, 230, 118, 0.1)' : '#0F172A',
            border: `1px solid ${isActive ? '#00E676' : '#334155'}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }),
        typeTitle: (isActive: boolean) => ({
            fontSize: '12px',
            fontWeight: 'bold',
            color: isActive ? '#00E676' : 'white',
            textTransform: 'uppercase' as const
        }),
        typeIcon: (isActive: boolean) => ({
            color: isActive ? '#00E676' : '#64748B'
        }),

        // FOOTER
        footer: {
            padding: '20px 24px',
            borderTop: '1px solid #334155',
            display: 'flex',
            gap: '12px',
            backgroundColor: '#1E293B'
        },
        saveBtn: {
            flex: 1,
            backgroundColor: '#00E676',
            color: '#0F172A',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.3)'
        },
        cancelBtn: {
            flex: 1,
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: '1px solid #334155',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer'
        }
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card}>

                {/* 1. HEADER */}
                <div style={STYLES.header}>
                    <div style={STYLES.iconBox}>
                        <Trophy size={20} />
                    </div>
                    <div style={STYLES.titleBox}>
                        <div style={STYLES.title}>Crear Nueva Liga</div>
                        <div style={STYLES.subtitle}>Configura los detalles de la competencia</div>
                    </div>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                {/* 2. BODY */}
                <div style={STYLES.body}>

                    {/* Nombre */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Nombre de la Liga</label>
                        <div style={STYLES.inputWrapper}>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Ej: Torneo Empresarial 2026"
                                style={STYLES.input}
                                autoFocus
                            />
                            <Trophy size={18} style={STYLES.inputIcon} />
                        </div>
                    </div>

                    {/* Tipo de Liga */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Tipo de Liga</label>
                        <div style={STYLES.typeGrid}>
                            <div
                                style={STYLES.typeCard(formData.type === 'LIBRE')}
                                onClick={() => handleTypeSelect('LIBRE')}
                            >
                                <Globe size={24} style={STYLES.typeIcon(formData.type === 'LIBRE')} />
                                <span style={STYLES.typeTitle(formData.type === 'LIBRE')}>Pública</span>
                            </div>
                            {/* Private option removed as it's not supported by backend enum yet */}
                            <div
                                style={STYLES.typeCard(formData.type === 'VIP')}
                                onClick={() => handleTypeSelect('VIP')}
                            >
                                <Crown size={24} style={STYLES.typeIcon(formData.type === 'VIP')} />
                                <span style={STYLES.typeTitle(formData.type === 'VIP')}>VIP (Max 5)</span>
                            </div>
                        </div>
                    </div>

                    {/* Capacidad */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Capacidad Máxima</label>
                        <div style={STYLES.inputWrapper}>
                            <input
                                type="number"
                                name="maxParticipants"
                                value={formData.maxParticipants}
                                onChange={handleChange}
                                style={STYLES.input}
                                min={2}
                                max={formData.type === 'VIP' ? 5 : 1000}
                            />
                            <Users size={18} style={STYLES.inputIcon} />
                        </div>
                        <p style={{ fontSize: '10px', color: '#64748B' }}>
                            {formData.type === 'VIP' ? 'Máximo 5 participantes para ligas VIP.' : 'Define el límite de usuarios permitidos.'}
                        </p>
                    </div>

                </div>

                {/* 3. FOOTER */}
                <div style={STYLES.footer}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        style={STYLES.saveBtn}
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Crear Liga
                    </button>
                </div>

            </div>
        </div>
    );
}
