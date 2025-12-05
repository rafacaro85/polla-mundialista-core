"use client";

import React, { useState } from 'react';
import { Save, Image, Gift, MessageSquare, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface LeagueBrandingFormProps {
    leagueId: string;
    initialData: {
        brandingLogoUrl?: string;
        prizeImageUrl?: string;
        prizeDetails?: string;
        welcomeMessage?: string;
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
        welcomeMessage: initialData.welcomeMessage || ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            // Assuming endpoint PATCH /api/leagues/:id exists and accepts these fields
            await axios.patch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/leagues/${leagueId}`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
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

            const token = localStorage.getItem('token');
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/upload`, uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`
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
