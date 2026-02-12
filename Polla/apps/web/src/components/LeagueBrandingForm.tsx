"use client";

import React, { useState, useEffect } from 'react';
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
        socialInstagram?: string;
        socialFacebook?: string;
        socialWhatsapp?: string;
        socialYoutube?: string;
        socialTiktok?: string;
        socialLinkedin?: string;
        socialWebsite?: string;
    };
    packageType?: string;
    onSuccess?: () => void;
}

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
        const plan = (packageType || 'familia').toLowerCase();
        
        // Jerarquía de Planes (Niveles)
        // 0: Familia / Starter (Solo Básicos)
        // 1: Parche (Foto Premio)
        // 2: Amigos (Logo)
        // 3: Líder (Chat)
        // 4: Influencer (Redes)
        // 5: Enterprise (Todo)

        const planLevels: Record<string, number> = {
            'familia': 0, 'starter': 0, 'free': 0,
            'launch_promo': 1, // Unlock Prize Image (Level 1)
            'parche': 1,
            'amigos': 2,
            'lider': 3,
            'influencer': 4,
            'pro': 5, 'elite': 5, 'legend': 5, 'enterprise': 5
        };

        const currentLevel = planLevels[plan] ?? 0;

        if (feature === 'prizeImage') return currentLevel >= 1; // Desde Parche
        if (feature === 'logo') return currentLevel >= 2;       // Desde Amigos
        
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
        brandColorSecondary: initialData.brandColorSecondary || '#1E293B',
        socialInstagram: initialData.socialInstagram || '',
        socialFacebook: initialData.socialFacebook || '',
        socialWhatsapp: initialData.socialWhatsapp || '',
        socialYoutube: initialData.socialYoutube || '',
        socialTiktok: initialData.socialTiktok || '',
        socialLinkedin: initialData.socialLinkedin || '',
        socialWebsite: initialData.socialWebsite || ''
    });

    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            ...initialData
        }));
    }, [initialData]);

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
        <label className={`
            flex items-center justify-center gap-2.5 p-3 rounded-xl transition-all w-full text-[13px] font-bold border-2 border-dashed group
            ${uploadingField === field
                ? 'bg-[#1E293B] border-[#00E676] text-[#00E676] cursor-not-allowed'
                : 'bg-[#0F172A] border-[#334155] text-white cursor-pointer hover:border-[#00E676]'
            }
        `}>
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
        <div className="bg-[#1E293B] rounded-2xl p-6 border border-[#334155] text-white">
            <div className="text-lg font-bold mb-6 text-[#00E676] flex items-center gap-2">
                <div className="p-2 bg-[#00E676]/20 rounded-lg">
                    <Gift size={20} />
                </div>
                Personalización Visual
            </div>

            {/* LOGO DE LA LIGA */}
            <div className="mb-5">
                <label className="text-[#94A3B8] text-[11px] font-bold mb-2 uppercase flex items-center gap-1.5">Logo Identitario de la Polla</label>
                {!isFeatureEnabled('logo') ? (
                    <PlanLock featureName="Logo de Liga" planNeeded="Amigos" />
                ) : (
                    <>
                        <UploadButton field="brandingLogoUrl" label="CAMBIAR LOGO" />
                        {formData.brandingLogoUrl && (
                            <div className="mt-3 w-full h-[140px] bg-[#0F172A] rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-[#00E676]/40 relative">
                                <img src={formData.brandingLogoUrl} alt="Logo" className="max-h-[90%] max-w-[90%] object-contain" />
                                <button
                                    onClick={() => handleChange('brandingLogoUrl', '')}
                                    className="absolute top-2 right-2 bg-red-500 text-white border-none rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer shadow-md"
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
            <div className="mb-5">
                <label className="text-[#94A3B8] text-[11px] font-bold mb-2 uppercase flex items-center gap-1.5">Imagen del Premio Principal</label>
                {!isFeatureEnabled('prizeImage') ? (
                    <PlanLock featureName="Imagen del Premio" planNeeded="Parche" />
                ) : (
                    <>
                        <UploadButton field="prizeImageUrl" label="SUBIR FOTO DEL PREMIO" />
                        {formData.prizeImageUrl && (
                            <div className="mt-3 w-full h-[140px] bg-[#0F172A] rounded-lg flex items-center justify-center overflow-hidden border border-dashed border-[#00E676]/40 relative">
                                <img src={formData.prizeImageUrl} alt="Premio" className="max-h-[90%] max-w-[90%] object-contain" />
                                <button
                                    onClick={() => handleChange('prizeImageUrl', '')}
                                    className="absolute top-2 right-2 bg-red-500 text-white border-none rounded-full w-[30px] h-[30px] flex items-center justify-center cursor-pointer shadow-md"
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
            <div className="mb-5">
                <label className="text-[#94A3B8] text-[11px] font-bold mb-2 uppercase flex items-center gap-1.5"><Gift size={14} /> Detalles del Premio</label>
                <textarea
                    value={formData.prizeDetails}
                    onChange={(e) => handleChange('prizeDetails', e.target.value)}
                    className="w-full p-3 bg-[#0F172A] border border-[#334155] rounded-lg text-white text-[13px] outline-none min-h-[80px] resize-y"
                    placeholder="Ej: Viaje a San Andrés para 2 personas..."
                />
            </div>



            {/* MURO DE COMENTARIOS */}
            <div className="mb-5 border-t border-[#334155] pt-5">
                <label className="text-[#94A3B8] text-[11px] font-bold mb-2 uppercase flex items-center gap-1.5"><MessageSquare size={14} /> Muro de Comentarios</label>
                {(() => {
                    const plan = (packageType || 'familia').toLowerCase();
                    const planLevels: Record<string, number> = { 'familia': 0, 'starter': 0, 'parche': 1, 'amigos': 2, 'lider': 3, 'influencer': 4, 'pro': 5 };
                    const level = planLevels[plan] ?? 0;
                    
                    return level < 3 ? ( // Requiere Líder (Nivel 3)
                        <PlanLock featureName="Muro de Comentarios" planNeeded="Líder" />
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-lg text-xs text-emerald-400 font-bold uppercase text-center">
                            ✅ El Muro de Comentarios está Habilitado
                        </div>
                    );
                })()}
            </div>

            {/* REDES SOCIALES */}
            <div className="mb-5">
                <label className="text-[#94A3B8] text-[11px] font-bold mb-2 uppercase flex items-center gap-1.5"><Share2 size={14} /> Enlaces a Redes Sociales</label>
                {(() => {
                    const plan = (packageType || 'familia').toLowerCase();
                    const planLevels: Record<string, number> = { 'familia': 0, 'starter': 0, 'parche': 1, 'amigos': 2, 'lider': 3, 'influencer': 4, 'pro': 5 };
                    const level = planLevels[plan] ?? 0;

                    return level < 4 ? ( // Requiere Influencer (Nivel 4)
                        <PlanLock featureName="Redes Sociales" planNeeded="Influencer" />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { key: 'socialInstagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/...' },
                                { key: 'socialFacebook', label: 'Facebook', icon: '👍', placeholder: 'https://facebook.com/...' },
                                { key: 'socialTiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@...' },
                                { key: 'socialYoutube', label: 'YouTube', icon: '📺', placeholder: 'https://youtube.com/c/...' },
                                { key: 'socialWhatsapp', label: 'WhatsApp', icon: '💬', placeholder: 'https://wa.me/...' },
                                { key: 'socialLinkedin', label: 'LinkedIn', icon: '💼', placeholder: 'https://linkedin.com/in/...' },
                                { key: 'socialWebsite', label: 'Sitio Web', icon: '🌐', placeholder: 'https://misito.com' },
                            ].map((social) => (
                                <div key={social.key} className="bg-[#0F172A] p-2 rounded-lg border border-[#334155] flex items-center gap-2">
                                    <span className="text-lg select-none w-8 text-center">{social.icon}</span>
                                    <div className="flex-1">
                                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">{social.label}</label>
                                        <input
                                            type="text"
                                            value={(formData as any)[social.key] || ''}
                                            onChange={(e) => handleChange(social.key, e.target.value)}
                                            className="w-full bg-transparent border-none text-white text-[11px] p-0 placeholder-slate-600 focus:ring-0"
                                            placeholder={social.placeholder}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    );
                })()}
            </div>

            <button
                onClick={handleSubmit}
                disabled={loading || !!uploadingField}
                className={`w-full p-3.5 bg-[#00E676] border-none rounded-xl text-[#0F172A] font-bold text-sm cursor-pointer flex items-center justify-center gap-2 mt-5 transition-opacity shadow-[0_4px_14px_0_rgba(0,230,118,0.39)] ${(loading || uploadingField) ? 'opacity-60' : 'opacity-100'}`}
            >
                {loading ? 'GUARDANDO...' : 'GUARDAR TODA LA CONFIGURACIÓN'}
            </button>
        </div>
    );
}
