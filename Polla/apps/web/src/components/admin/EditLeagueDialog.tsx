'use client';

import React, { useState, useEffect } from 'react';
import { Save, X, Users, Copy, Loader2, Image, Gift, MessageSquare } from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

interface League {
    id: string;
    name: string;
    code?: string;
    admin?: string;
    members?: number;
    capacity?: number;
    type?: string;
    creator?: {
        nickname: string;
    };
    participantCount?: number;
    maxParticipants?: number;
    brandingLogoUrl?: string;
    prizeImageUrl?: string;
    prizeDetails?: string;
    welcomeMessage?: string;
}

interface EditLeagueDialogProps {
    league: League;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

/* =============================================================================
   COMPONENTE: MODAL EDITAR LIGA (TACTICAL STYLE)
   ============================================================================= */
export function EditLeagueDialog({ league, open, onOpenChange, onSuccess }: EditLeagueDialogProps) {

    // Estados del formulario
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        admin: '',
        members: 0,
        capacity: 0,
        type: 'private',
        brandingLogoUrl: '',
        prizeImageUrl: '',
        prizeDetails: '',
        welcomeMessage: ''
    });

    useEffect(() => {
        if (league) {
            setFormData({
                name: league.name || '',
                code: league.code || '',
                admin: league.creator?.nickname || league.admin || '',
                members: league.participantCount || league.members || 0,
                capacity: league.maxParticipants || league.capacity || 20,
                type: league.type || 'private',
                brandingLogoUrl: league.brandingLogoUrl || '',
                prizeImageUrl: league.prizeImageUrl || '',
                prizeDetails: league.prizeDetails || '',
                welcomeMessage: league.welcomeMessage || ''
            });
        }
    }, [league, open]);

    if (!open || !league) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (file: File, field: string) => {
        try {
            setLoading(true);
            const uploadData = new FormData();
            uploadData.append('file', file);

            const response = await api.post('/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            setFormData(prev => ({ ...prev, [field]: response.data.url }));
            toast.success('Imagen subida correctamente');
        } catch (error) {
            console.error('Error uploading file:', error);
            toast.error('Error al subir la imagen');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            toast.error('El nombre no puede estar vacío');
            return;
        }

        setLoading(true);
        try {
            await api.patch(`/leagues/${league.id}`, {
                name: formData.name,
                brandingLogoUrl: formData.brandingLogoUrl,
                prizeImageUrl: formData.prizeImageUrl,
                prizeDetails: formData.prizeDetails,
                welcomeMessage: formData.welcomeMessage
            });
            toast.success(`Liga actualizada a "${formData.name}"`);
            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error updating league:', error);
            toast.error(error.response?.data?.message || 'Error al actualizar la liga');
        } finally {
            setLoading(false);
        }
    };

    const handleCopyCode = () => {
        navigator.clipboard.writeText(formData.code);
        toast.success('Código copiado al portapapeles');
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
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            display: 'flex',
            flexDirection: 'column' as const,
            maxHeight: '90vh',
            overflowY: 'auto' as const,
            fontFamily: 'sans-serif',
            position: 'relative' as const
        },

        // HEADER CON IMAGEN Y DETALLES
        headerBanner: {
            backgroundColor: '#0F172A',
            padding: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            borderBottom: '1px solid #334155',
            position: 'relative' as const
        },
        closeBtn: {
            position: 'absolute' as const,
            top: '12px',
            left: '12px',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '8px',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        },
        leagueIcon: {
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            backgroundColor: '#1E293B',
            border: '2px solid #00E676',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#00E676',
            fontSize: '28px',
            fontFamily: "'Russo One', sans-serif",
            boxShadow: '0 0 15px rgba(0, 230, 118, 0.2)',
            overflow: 'hidden'
        },
        leagueInfo: {
            flex: 1
        },
        leagueNameTitle: {
            color: 'white',
            fontFamily: "'Russo One', sans-serif",
            fontSize: '20px',
            lineHeight: '1.2',
            marginBottom: '4px'
        },
        ownerInfo: {
            fontSize: '12px',
            color: '#94A3B8',
            fontWeight: 'bold'
        },

        // CÓDIGO DE ACCESO (CHIP DESTACADO)
        codeSection: {
            backgroundColor: 'rgba(255,255,255,0.03)',
            marginTop: '16px',
            padding: '12px 16px',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            border: '1px dashed #334155'
        },
        codeLabel: {
            fontSize: '10px',
            color: '#94A3B8',
            fontWeight: 'bold',
            textTransform: 'uppercase' as const,
            letterSpacing: '1px'
        },
        codeBadge: {
            backgroundColor: '#0F172A',
            padding: '6px 12px',
            borderRadius: '6px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '14px',
            fontWeight: 'bold',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border: '1px solid #334155',
            cursor: 'pointer'
        },

        // CUERPO DEL FORMULARIO
        body: {
            padding: '24px',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '20px'
        },
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
        input: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '14px',
            fontWeight: 'bold',
            outline: 'none',
            transition: 'border-color 0.2s'
        },
        textarea: {
            width: '100%',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '12px',
            padding: '14px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            outline: 'none',
            fontFamily: 'sans-serif',
            minHeight: '80px',
            resize: 'vertical' as const
        },
        fileLabel: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#0F172A',
            border: '1px dashed #334155',
            borderRadius: '12px',
            padding: '12px 20px',
            color: '#94A3B8',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            width: '100%',
            justifyContent: 'center'
        },
        fileInput: {
            display: 'none'
        },
        previewBox: {
            marginTop: '8px',
            width: '100%',
            height: '120px',
            backgroundColor: '#0F172A',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            border: '1px solid #334155'
        },

        // FOOTER
        footer: {
            padding: '0 24px 24px 24px',
            display: 'grid',
            gridTemplateColumns: '1fr',
            gap: '12px'
        },
        saveBtn: {
            width: '100%',
            backgroundColor: 'white',
            color: '#0F172A',
            border: 'none',
            padding: '14px',
            borderRadius: '12px',
            fontWeight: '900',
            fontSize: '14px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
        },
        cancelBtn: {
            width: '100%',
            backgroundColor: 'transparent',
            color: '#94A3B8',
            border: '1px solid #334155',
            padding: '12px',
            borderRadius: '12px',
            fontWeight: 'bold',
            fontSize: '12px',
            textTransform: 'uppercase' as const,
            cursor: 'pointer'
        }
    };

    return (
        <div style={STYLES.overlay}>
            <div style={STYLES.card} className="no-scrollbar">

                {/* 1. HEADER TIPO TARJETA */}
                <div style={STYLES.headerBanner}>
                    <button onClick={() => onOpenChange(false)} style={STYLES.closeBtn}>
                        <X size={18} />
                    </button>

                    <div style={STYLES.leagueIcon}>
                        {formData.brandingLogoUrl ? (
                            <img src={formData.brandingLogoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            formData.name.charAt(0).toUpperCase()
                        )}
                    </div>

                    <div style={STYLES.leagueInfo}>
                        <div style={STYLES.leagueNameTitle}>{formData.name}</div>
                        <div style={STYLES.ownerInfo}>
                            Dueño: <span style={{ color: 'white' }}>{formData.admin}</span> • <Users size={10} style={{ display: 'inline', marginBottom: '2px' }} /> {formData.members} / {formData.capacity}
                        </div>

                        {/* Código Chip */}
                        <div style={STYLES.codeSection}>
                            <span style={STYLES.codeLabel}>CÓDIGO DE ACCESO</span>
                            <div
                                style={STYLES.codeBadge}
                                onClick={handleCopyCode}
                                title="Copiar Código"
                            >
                                {formData.code} <Copy size={12} style={{ opacity: 0.5 }} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. FORMULARIO EDICIÓN */}
                <div style={STYLES.body}>

                    <div style={{ textAlign: 'center', color: 'white', fontSize: '16px', fontFamily: "'Russo One', sans-serif", textTransform: 'uppercase' }}>
                        EDITAR LIGA
                    </div>
                    <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '12px', marginTop: '-16px', marginBottom: '8px' }}>
                        Personaliza los detalles y el branding
                    </div>

                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}>Nombre</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            style={STYLES.input}
                            onFocus={(e) => e.target.style.borderColor = '#00E676'}
                            onBlur={(e) => e.target.style.borderColor = '#334155'}
                        />
                    </div>

                    {/* Branding Logo */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}><Image size={14} /> Logo de la Empresa / Liga</label>
                        <label style={STYLES.fileLabel}>
                            <input
                                type="file"
                                accept="image/*"
                                style={STYLES.fileInput}
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'brandingLogoUrl')}
                            />
                            {formData.brandingLogoUrl ? 'Cambiar Logo' : 'Subir Logo'}
                        </label>
                    </div>

                    {/* Premio Imagen */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}><Gift size={14} /> Imagen del Premio</label>
                        <label style={STYLES.fileLabel}>
                            <input
                                type="file"
                                accept="image/*"
                                style={STYLES.fileInput}
                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'prizeImageUrl')}
                            />
                            {formData.prizeImageUrl ? 'Cambiar Imagen' : 'Subir Imagen del Premio'}
                        </label>
                        {formData.prizeImageUrl && (
                            <div style={STYLES.previewBox}>
                                <img src={formData.prizeImageUrl} alt="Premio" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }} />
                            </div>
                        )}
                    </div>

                    {/* Premio Detalles */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}><Gift size={14} /> Descripción del Premio</label>
                        <textarea
                            name="prizeDetails"
                            value={formData.prizeDetails}
                            onChange={handleChange}
                            placeholder="Ej: Camiseta oficial autografiada..."
                            style={STYLES.textarea}
                        />
                    </div>

                    {/* Mensaje Bienvenida */}
                    <div style={STYLES.inputGroup}>
                        <label style={STYLES.label}><MessageSquare size={14} /> Mensaje de Bienvenida</label>
                        <textarea
                            name="welcomeMessage"
                            value={formData.welcomeMessage}
                            onChange={handleChange}
                            placeholder="Mensaje para los participantes..."
                            style={STYLES.textarea}
                        />
                    </div>

                </div>

                {/* 3. FOOTER */}
                <div style={STYLES.footer}>
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
                                <Save size={18} /> Guardar
                            </>
                        )}
                    </button>
                    <button onClick={() => onOpenChange(false)} style={STYLES.cancelBtn}>
                        Cancelar
                    </button>
                </div>

            </div>
        </div>
    );
}
