"use client";

import React, { useState } from 'react';
import { Save, Image, Gift, MessageSquare, AlertCircle, Briefcase } from 'lucide-react';
import api from '@/lib/api';

interface LeagueBrandingFormProps {
    leagueId: string;
    initialData: {
        brandingLogoUrl?: string;
        prizeImageUrl?: string;
        prizeDetails?: string;
        welcomeMessage?: string;
        isEnterprise?: boolean;
        companyName?: string;
        brandColorPrimary?: string;
        brandColorSecondary?: string;
    };
    onSuccess?: () => void;
}

const STYLES = {
    container: {
        backgroundColor: '#1E293B',
        borderRadius: '16px',
        padding: '24px',
        border: '1px solid #334155',
        color: 'white'
    },
    title: {
        fontSize: '18px',
        fontWeight: 'bold',
        marginBottom: '24px',
        color: '#00E676',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
    },
    fieldGroup: {
        marginBottom: '20px'
    },
    label: {
        color: '#94A3B8',
        fontSize: '11px',
        fontWeight: 'bold',
        marginBottom: '8px',
        textTransform: 'uppercase' as const,
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    },
    input: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        outline: 'none',
        transition: 'border-color 0.2s'
    },
    textarea: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#0F172A',
        border: '1px solid #334155',
        borderRadius: '8px',
        color: 'white',
        fontSize: '13px',
        outline: 'none',
        minHeight: '80px',
        resize: 'vertical' as const
    },
    button: {
        width: '100%',
        padding: '14px',
        backgroundColor: '#00E676',
        border: 'none',
        borderRadius: '12px',
        color: '#0F172A',
        fontWeight: 'bold',
        fontSize: '14px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '8px',
        transition: 'opacity 0.2s'
    },
    preview: {
        marginTop: '8px',
        width: '100%',
        height: '100px',
        backgroundColor: '#0F172A',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        border: '1px dashed #334155'
    }
};

export default function LeagueBrandingForm({ leagueId, initialData, onSuccess }: LeagueBrandingFormProps) {
    const [formData, setFormData] = useState({
        brandingLogoUrl: initialData.brandingLogoUrl || '',
        prizeImageUrl: initialData.prizeImageUrl || '',
        prizeDetails: initialData.prizeDetails || '',
        welcomeMessage: initialData.welcomeMessage || '',
        isEnterprise: initialData.isEnterprise || false,
        companyName: initialData.companyName || '',
        brandColorPrimary: initialData.brandColorPrimary || '#00E676',
        brandColorSecondary: initialData.brandColorSecondary || '#1E293B'
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Usar api instance (base URL y token ya configurados)
            await api.patch(`/leagues/${leagueId}`, formData);
            alert('Configuración guardada correctamente');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error saving league branding:', error);
            alert('Error al guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file: File, field: string) => {
        try {
            setLoading(true);
            const uploadData = new FormData();
            uploadData.append('file', file);

            const response = await api.post('/upload', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            handleChange(field, response.data.url);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Error al subir la imagen');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={STYLES.container}>
            <div style={STYLES.title}>
                <Gift size={20} /> Personalización de Liga
            </div>

            {/* LOGO URL */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><Image size={14} /> Logo de la Liga</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'brandingLogoUrl')}
                        style={{ ...STYLES.input, padding: '8px' }}
                    />
                </div>
                {formData.brandingLogoUrl && (
                    <div style={STYLES.preview}>
                        <img src={formData.brandingLogoUrl} alt="Logo Preview" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                    </div>
                )}
            </div>

            {/* PREMIO IMAGE URL */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><Image size={14} /> Imagen del Premio</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'prizeImageUrl')}
                        style={{ ...STYLES.input, padding: '8px' }}
                    />
                </div>
                {formData.prizeImageUrl && (
                    <div style={STYLES.preview}>
                        <img src={formData.prizeImageUrl} alt="Prize Preview" style={{ maxHeight: '100%', maxWidth: '100%' }} />
                    </div>
                )}
            </div>

            {/* DESCRIPCIÓN DEL PREMIO */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><Gift size={14} /> Descripción del Premio</label>
                <textarea
                    value={formData.prizeDetails}
                    onChange={(e) => handleChange('prizeDetails', e.target.value)}
                    style={STYLES.textarea}
                    placeholder="Describe el premio para el ganador..."
                    onFocus={(e) => e.target.style.borderColor = '#00E676'}
                    onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
            </div>

            {/* MENSAJE DE BIENVENIDA */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><MessageSquare size={14} /> Mensaje de Bienvenida (Opcional)</label>
                <textarea
                    value={formData.welcomeMessage}
                    onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                    style={STYLES.textarea}
                    placeholder="Mensaje para los participantes al unirse..."
                    onFocus={(e) => e.target.style.borderColor = '#00E676'}
                    onBlur={(e) => e.target.style.borderColor = '#334155'}
                />
            </div>

            {/* SECCIÓN ENTERPRISE */}
            <div style={{ ...STYLES.fieldGroup, borderTop: '1px solid #334155', paddingTop: '20px', marginTop: '20px' }}>
                <div style={STYLES.title}>
                    <Briefcase size={20} /> Branding Corporativo
                </div>

                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="checkbox"
                        checked={!!formData.isEnterprise}
                        onChange={(e) => handleChange('isEnterprise', e.target.checked)}
                        style={{ width: '20px', height: '20px', accentColor: '#00E676', cursor: 'pointer' }}
                    />
                    <label style={{ ...STYLES.label, marginBottom: 0, cursor: 'pointer' }} onClick={() => handleChange('isEnterprise', !formData.isEnterprise)}>
                        Activar Funciones Enterprise
                    </label>
                </div>

                {formData.isEnterprise && (
                    <div style={{ paddingLeft: '10px', borderLeft: '2px solid #00E676', marginLeft: '9px' }}>
                        <div style={STYLES.fieldGroup}>
                            <label style={STYLES.label}>Nombre de la Empresa</label>
                            <input
                                type="text"
                                value={formData.companyName || ''}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                style={STYLES.input}
                                placeholder="Ej. TechCorp Solutions"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '20px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>Color Primario</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={formData.brandColorPrimary || '#00E676'}
                                        onChange={(e) => handleChange('brandColorPrimary', e.target.value)}
                                        style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{formData.brandColorPrimary}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>Color Secundario</label>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <input
                                        type="color"
                                        value={formData.brandColorSecondary || '#1E293B'}
                                        onChange={(e) => handleChange('brandColorSecondary', e.target.value)}
                                        style={{ width: '40px', height: '40px', padding: 0, border: 'none', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'transparent' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#94A3B8' }}>{formData.brandColorSecondary}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading}
                style={{ ...STYLES.button, opacity: loading ? 0.7 : 1 }}
            >
                <Save size={18} /> {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
        </div>
    );
}
