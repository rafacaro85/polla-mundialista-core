"use client";

import React, { useState } from 'react';
import { Save, Image, Gift, MessageSquare, AlertCircle, Briefcase, Trash2, Lock, Share2 } from 'lucide-react';
import api from '@/lib/api';

interface LeagueBrandingFormProps {
    leagueId: string;
    showEnterpriseFields?: boolean;
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
    packageType?: string;
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

const PlanLock = ({ featureName, planNeeded }: { featureName: string, planNeeded: string }) => (
    <div className="bg-slate-900/80 border border-slate-700/50 p-4 rounded-xl flex items-center justify-between gap-4 mt-2 mb-4">
        <div className="flex items-center gap-3">
            <div className="bg-slate-800 p-2 rounded-lg">
                <Lock size={16} className="text-slate-500" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Función Bloqueada</p>
                <p className="text-xs text-slate-400">El {featureName} requiere el plan <strong>{planNeeded}</strong></p>
            </div>
        </div>
        <button
            onClick={() => {
                const text = `Hola, quiero subir de plan para desbloquear la función "${featureName}".`;
                window.open(`https://wa.me/573105973421?text=${encodeURIComponent(text)}`, '_blank');
            }}
            className="text-[10px] font-bold text-emerald-500 uppercase hover:underline"
        >
            Mejorar Plan
        </button>
    </div>
);

export default function LeagueBrandingForm({ leagueId, initialData, onSuccess, showEnterpriseFields = false, packageType = 'familia' }: LeagueBrandingFormProps) {
    const isFeatureEnabled = (feature: 'logo' | 'prizeImage') => {
        // Mapeo de compatibilidad con planes antiguos
        const plan = packageType.toLowerCase();

        if (feature === 'prizeImage') {
            return !['familia', 'starter'].includes(plan);
        }
        if (feature === 'logo') {
            return !['familia', 'starter', 'parche', 'amateur'].includes(plan);
        }
        return true;
    };
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

    const [uploadingField, setUploadingField] = useState<string | null>(null);

    const handleChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            await api.patch(`/leagues/${leagueId}`, formData);
            alert('¡Configuración guardada! Los cambios ya son visibles.');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Error saving league branding:', error);
            alert('Error al guardar los cambios finales.');
        } finally {
            setLoading(false);
        }
    };

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new window.Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    const MAX_SIZE = 1200;
                    if (width > height) {
                        if (width > MAX_SIZE) {
                            height *= MAX_SIZE / width;
                            width = MAX_SIZE;
                        }
                    } else {
                        if (height > MAX_SIZE) {
                            width *= MAX_SIZE / height;
                            height = MAX_SIZE;
                        }
                    }
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return reject(new Error('Canvas context failed'));
                    ctx.drawImage(img, 0, 0, width, height);
                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob);
                        else reject(new Error('Blob creation failed'));
                    }, 'image/jpeg', 0.8);
                };
                img.onerror = () => reject(new Error('Image load failed'));
                img.src = event.target?.result as string;
            };
            reader.onerror = () => reject(new Error('File read failed'));
        });
    };

    const handleFileUpload = async (file: File, field: string) => {
        try {
            setUploadingField(field);
            let fileToUpload: File | Blob = file;
            let filename = file.name;

            try {
                const compressed = await compressImage(file);
                fileToUpload = compressed;
                filename = `upload_${Date.now()}.jpg`;
            } catch (e) {
                console.warn('Usando original (compresión falló)');
            }

            const uploadData = new FormData();
            uploadData.append('file', fileToUpload, filename);

            const response = await api.post('/upload', uploadData);

            if (response.data && response.data.url) {
                handleChange(field, response.data.url);
            } else {
                throw new Error('No URL in response');
            }
        } catch (error: any) {
            console.error('Upload error:', error);
            const msg = error.response?.data?.message || 'Error de conexión';
            const detail = error.response?.data?.detail ? ` (${error.response.data.detail})` : '';
            alert(`Error: ${msg}${detail}`);
        } finally {
            setUploadingField(null);
        }
    };

    const UploadButton = ({ field, label }: { field: string, label: string }) => (
        <label style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            padding: '12px',
            backgroundColor: uploadingField === field ? '#1E293B' : '#0F172A',
            border: `2px dashed ${uploadingField === field ? '#00E676' : '#334155'}`,
            borderRadius: '12px',
            cursor: uploadingField ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            width: '100%',
            color: uploadingField === field ? '#00E676' : 'white',
            fontSize: '13px',
            fontWeight: 'bold'
        }} className="hover:border-[#00E676] group">
            {uploadingField === field ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#00E676] border-t-transparent"></div>
            ) : (
                <Image size={18} className="text-[#00E676]" />
            )}
            <span>{uploadingField === field ? 'SUBIENDO...' : label}</span>
            <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], field)}
                style={{ display: 'none' }}
                disabled={!!uploadingField}
            />
        </label>
    );

    return (
        <div style={STYLES.container}>
            <div style={STYLES.title}>
                <div style={{ padding: '8px', backgroundColor: '#00E67620', borderRadius: '8px' }}>
                    <Gift size={20} />
                </div>
                Personalización Visual
            </div>

            {/* LOGO DE LA LIGA */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}>Logo Identitario de la Polla</label>
                {!isFeatureEnabled('logo') ? (
                    <PlanLock featureName="Logo de Liga" planNeeded="Amigos" />
                ) : (
                    <>
                        <UploadButton field="brandingLogoUrl" label="CAMBIAR LOGO" />
                        {formData.brandingLogoUrl && (
                            <div style={{ ...STYLES.preview, height: '140px', marginTop: '12px', borderColor: '#00E67640', position: 'relative' }}>
                                <img src={formData.brandingLogoUrl} alt="Logo" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
                                <button
                                    onClick={() => handleChange('brandingLogoUrl', '')}
                                    style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                                    title="Eliminar imagen"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* IMAGEN DEL PREMIO */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}>Imagen del Premio Principal</label>
                {!isFeatureEnabled('prizeImage') ? (
                    <PlanLock featureName="Imagen del Premio" planNeeded="Parche" />
                ) : (
                    <>
                        <UploadButton field="prizeImageUrl" label="SUBIR FOTO DEL PREMIO" />
                        {formData.prizeImageUrl && (
                            <div style={{ ...STYLES.preview, height: '140px', marginTop: '12px', borderColor: '#00E67640', position: 'relative' }}>
                                <img src={formData.prizeImageUrl} alt="Premio" style={{ maxHeight: '90%', maxWidth: '90%', objectFit: 'contain' }} />
                                <button
                                    onClick={() => handleChange('prizeImageUrl', '')}
                                    style={{ position: 'absolute', top: '8px', right: '8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)' }}
                                    title="Eliminar imagen"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* DESCRIPCIÓN DEL PREMIO */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><Gift size={14} /> Detalles del Premio</label>
                <textarea
                    value={formData.prizeDetails}
                    onChange={(e) => handleChange('prizeDetails', e.target.value)}
                    style={STYLES.textarea}
                    placeholder="Ej: Viaje a San Andrés para 2 personas..."
                />
            </div>

            {/* MENSAJE DE BIENVENIDA */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><MessageSquare size={14} /> Mensaje de Bienvenida</label>
                <textarea
                    value={formData.welcomeMessage}
                    onChange={(e) => handleChange('welcomeMessage', e.target.value)}
                    style={STYLES.textarea}
                    placeholder="Escribe un saludo para tus jugadores..."
                />
            </div>

            {/* MURO DE COMENTARIOS */}
            <div style={{ ...STYLES.fieldGroup, borderTop: '1px solid #334155', paddingTop: '20px' }}>
                <label style={STYLES.label}><MessageSquare size={14} /> Muro de Comentarios</label>
                {!['lider', 'influencer', 'pro', 'elite', 'legend'].includes((packageType || '').toLowerCase()) ? (
                    <PlanLock featureName="Muro de Comentarios" planNeeded="Líder" />
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-400 font-bold uppercase text-center">
                        ✅ El Muro de Comentarios está Habilitado
                    </div>
                )}
            </div>

            {/* REDES SOCIALES */}
            <div style={STYLES.fieldGroup}>
                <label style={STYLES.label}><Share2 size={14} /> Enlaces a Redes Sociales</label>
                {!['influencer', 'elite', 'legend'].includes((packageType || '').toLowerCase()) ? (
                    <PlanLock featureName="Redes Sociales" planNeeded="Influencer" />
                ) : (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-400 font-bold uppercase text-center">
                        ✅ Redes Sociales Habilitadas
                    </div>
                )}
            </div>

            {/* SECCIÓN ENTERPRISE */}
            {showEnterpriseFields && (
                <div style={{ ...STYLES.fieldGroup, borderTop: '1px solid #334155', paddingTop: '20px', marginTop: '30px' }}>
                    <div style={{ ...STYLES.title, fontSize: '15px' }}>
                        <Briefcase size={18} /> Configuración Corporativa
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <div>
                            <label style={STYLES.label}>Nombre de la Empresa</label>
                            <input
                                type="text"
                                value={formData.companyName || ''}
                                onChange={(e) => handleChange('companyName', e.target.value)}
                                style={STYLES.input}
                                placeholder="Nombre comercial..."
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>Color Principal</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#0F172A', padding: '6px', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <input
                                        type="color"
                                        value={formData.brandColorPrimary || '#00E676'}
                                        onChange={(e) => handleChange('brandColorPrimary', e.target.value)}
                                        style={{ width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{formData.brandColorPrimary}</span>
                                </div>
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={STYLES.label}>Color Fondo</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', backgroundColor: '#0F172A', padding: '6px', borderRadius: '8px', border: '1px solid #334155' }}>
                                    <input
                                        type="color"
                                        value={formData.brandColorSecondary || '#1E293B'}
                                        onChange={(e) => handleChange('brandColorSecondary', e.target.value)}
                                        style={{ width: '30px', height: '30px', padding: 0, border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                    />
                                    <span style={{ fontSize: '12px', color: '#94A3B8', fontFamily: 'monospace' }}>{formData.brandColorSecondary}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <button
                onClick={handleSubmit}
                disabled={loading || !!uploadingField}
                style={{
                    ...STYLES.button,
                    opacity: (loading || uploadingField) ? 0.6 : 1,
                    boxShadow: '0 4px 14px 0 rgba(0, 230, 118, 0.39)',
                    marginTop: '20px'
                }}
            >
                {loading ? 'GUARDANDO...' : 'GUARDAR TODA LA CONFIGURACIÓN'}
            </button>
        </div>
    );
}
