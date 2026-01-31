"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Save, ArrowLeft,
    Palette, Type, Image as ImageIcon,
    Building2, Eye, Check, Share2, Megaphone
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MobilePreview } from './MobilePreview';
import { TabButton } from './components/StudioUI';
import { PaymentMethods } from '@/components/dashboard/PaymentMethods';
import { BrandingTab } from './components/BrandingTab';
import { AssetsTab } from './components/AssetsTab';
import { ContentTab } from './components/ContentTab';
import { SocialTab } from './components/SocialTab';
import { AdsTab } from './components/AdsTab';
import { useImageUpload } from '@/hooks/useImageUpload';

/* --- PÁGINA PRINCIPAL STUDIO --- */

const getPriceForPlan = (type?: string) => {
    if (!type) return 180000;
    const t = type.toUpperCase();

    // Enterprise Plans
    if (t.includes('DIAMOND') || t.includes('ENTERPRISE_DIAMOND')) return 1000000;
    if (t.includes('PLATINUM') || t.includes('ENTERPRISE_PLATINUM')) return 750000;
    if (t.includes('GOLD') || t.includes('ENTERPRISE_GOLD')) return 450000;
    if (t.includes('SILVER') || t.includes('ENTERPRISE_SILVER')) return 175000;
    if (t.includes('BRONZE') || t.includes('ENTERPRISE_BRONZE')) return 100000;

    // Legacy
    if (t === 'BUSINESS_GROWTH') return 350000;
    if (t === 'BUSINESS_CORP') return 900000;

    return 180000;
};

const getPlanLevel = (type?: string) => {
    if (!type) return 1;
    const t = type.toUpperCase();
    if (t.includes('DIAMOND') || t.includes('DIAMANTE')) return 5;
    if (t.includes('PLATINUM') || t.includes('PLATINO')) return 4;
    if (t.includes('BUSINESS_CORP')) return 4;
    if (t.includes('GOLD') || t.includes('ORO')) return 3;
    if (t.includes('SILVER') || t.includes('PLATA')) return 2;
    if (t.includes('BUSINESS_GROWTH')) return 2;
    return 1;
};

export default function StudioPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('branding');
    const [previewOpen, setPreviewOpen] = useState(false);

    // Live Configuration State
    const [config, setConfig] = useState({
        brandColorPrimary: '#00E676',
        brandColorSecondary: '#1E293B',
        brandColorBg: '#0F172A',
        brandColorText: '#F8FAFC',
        companyName: 'Mi Empresa S.A.',
        welcomeMessage: '¡Bienvenidos a la polla corporativa! El ganador se llevará un premio sorpresa.',
        brandingLogoUrl: '',
        brandCoverUrl: '',
        prizeImageUrl: '',
        brandFontFamily: '"Russo One", sans-serif',
        isEnterprise: true,
        isEnterpriseActive: true,
        enableDepartmentWar: false,
        packageType: 'familia',
        // Social Media
        socialInstagram: '',
        socialFacebook: '',
        socialWhatsapp: '',
        socialYoutube: '',
        socialTiktok: '',
        socialLinkedin: '',
        socialWebsite: '',
        // Ads
        showAds: false,
        adImages: [] as string[]
    });

    // Font Options
    const fontOptions = [
        { name: 'Deportiva (Russo)', value: '"Russo One", sans-serif' },
        { name: 'Moderna (Inter)', value: 'Inter, sans-serif' },
        { name: 'Geométrica (Poppins)', value: 'Poppins, sans-serif' },
        { name: 'Elegante (Slab)', value: '"Roboto Slab", serif' },
    ];

    // Mock Data for Preview
    const [participantsMock] = useState([
        { id: '1', nickname: 'Campeón', rank: 1, points: 150, avatarUrl: '' },
        { id: '2', nickname: 'Retador', rank: 2, points: 145, avatarUrl: '' },
        { id: '3', nickname: 'Novato', rank: 3, points: 120, avatarUrl: '' },
    ]);

    // Hook Use
    const { uploadingState, handleImageUpload: uploadImage } = useImageUpload();

    // WRAPPER FOR UPLOAD
    const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        await uploadImage(key, e, (url) => {
            setConfig(prev => ({ ...prev, [key]: url }));
        });
    };

    // ADVERTISING HANDLERS
    // Plan Level Calculation
    const currentPlanLevel = getPlanLevel((config as any).packageType);

    const handleAdImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        await uploadImage('ad_loading', e, (url) => {
            setConfig(prev => {
                const current = prev.adImages || [];
                if (current.length >= 3) return prev;
                return { ...prev, adImages: [...current, url] };
            });
        });
    };

    const handleRemoveAdImage = (index: number) => {
        setConfig(prev => {
            const current = [...(prev.adImages || [])];
            current.splice(index, 1);
            return { ...prev, adImages: current };
        });
    };

    useEffect(() => {
        const load = async () => {
            try {
                // Fetching specific league details to allow Admin access as well
                const { data } = await api.get(`/leagues/${params.id}`);
                console.log('STUDIO LOAD DATA:', data); // DEBUG
                if (data) {
                    setConfig(prev => ({ ...prev, ...data }));
                } else {
                    toast({ title: 'Error', description: 'No se encontró la liga', variant: 'destructive' });
                }
            } catch (e: any) {
                console.error(e);
                if (e.response?.status === 403) {
                    toast({ title: 'Acceso Denegado', description: 'No tienes permisos para editar esta liga.', variant: 'destructive' });
                } else {
                    toast({ title: 'Error', description: 'No se pudo cargar la liga', variant: 'destructive' });
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params.id, toast]);

    // Helper para limpiar el payload y enviar SOLO lo que el DTO espera
    const getCleanPayload = (cfg: any) => ({
        companyName: cfg.companyName,
        brandColorPrimary: cfg.brandColorPrimary,
        brandColorSecondary: cfg.brandColorSecondary,
        brandColorBg: cfg.brandColorBg,
        brandColorText: cfg.brandColorText,
        brandFontFamily: cfg.brandFontFamily,
        brandingLogoUrl: cfg.brandingLogoUrl,
        brandCoverUrl: cfg.brandCoverUrl,
        prizeImageUrl: cfg.prizeImageUrl,
        prizeDetails: cfg.prizeDetails,
        welcomeMessage: cfg.welcomeMessage,
        enableDepartmentWar: cfg.enableDepartmentWar,
        // Social
        socialInstagram: cfg.socialInstagram,
        socialFacebook: cfg.socialFacebook,
        socialWhatsapp: cfg.socialWhatsapp,
        socialYoutube: cfg.socialYoutube,
        socialTiktok: cfg.socialTiktok,
        socialLinkedin: cfg.socialLinkedin,
        socialWebsite: cfg.socialWebsite,
        // Ads
        showAds: cfg.showAds,
        adImages: cfg.adImages,
    });


    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            // Evitar enviar campos protegidos que solo SUPER_ADMIN puede editar
            // Limpiar payload para evitar enviar campos no permitidos (Error 400)
            const cleanConfig = getCleanPayload(config);

            await api.patch(`/leagues/${params.id}`, {
                ...cleanConfig,
                isEnterprise: true
            });
            toast({ title: '💾 Cambios Guardados', description: 'Tu diseño se guardó correctamente.' });
        } catch (error: any) {
            console.error('Error al guardar:', error);
            toast({ title: 'Error', description: 'No se pudo guardar.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handlePublish = async () => {
        setSaving(true);
        try {
            // 1. Obtener estado ACTUAL de la liga para asegurar que no tenemos datos viejos
            const { data: currentStatus } = await api.get(`/leagues/${params.id}`);

            // 2. Preparar payload sin isEnterpriseActive
            // 2. Preparar payload limpio
            const cleanConfig = getCleanPayload(config);

            const { data: updatedLeague } = await api.patch(`/leagues/${params.id}`, {
                ...cleanConfig,
                isEnterprise: true
            });

            // Mezclamos la respuesta buscando la verdad: ¿Está activa en DB?
            // Usamos currentStatus.isEnterpriseActive porque acabamos de consultar la fuente de la verdad
            const isActive = currentStatus.isEnterpriseActive || updatedLeague.isEnterpriseActive;

            setConfig(prev => ({ ...prev, ...updatedLeague, isEnterpriseActive: isActive }));

            if (!isActive) {
                setShowActivation(true);
                toast({ title: 'Diseño Guardado', description: 'Solicita la activación para publicar.', duration: 5000 });
            } else {
                toast({ title: '✅ Publicando...', description: 'Aplicando cambios a tu polla empresarial.' });
                setTimeout(() => {
                    window.location.href = `/leagues/${params.id}`;
                }, 1000);
            }
        } catch (error: any) {
            console.error('Error al publicar:', error);
            toast({ title: 'Error', description: 'No se pudo publicar.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    // Modal de Activación
    const [showActivation, setShowActivation] = useState(false);
    const handleWhatsAppContact = () => {
        const message = encodeURIComponent(`Hola! Quiero activar mi Polla Empresarial "${config.companyName}".`);
        window.open(`https://wa.me/573102345678?text=${message}`, '_blank');
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#0B1120]"><Loader2 className="animate-spin text-[#00E676]" /></div>;

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans flex flex-col pt-16 md:pt-20">

            {/* HEADER SUPERIOR (FIXED) */}
            <header className="fixed top-0 left-0 right-0 h-16 md:h-20 border-b border-[#1E293B] bg-[#0F172A]/95 backdrop-blur-md px-4 md:px-8 flex items-center justify-between z-50 shadow-md">
                <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <button onClick={() => router.back()} className="hover:bg-white/10 p-2 rounded-full transition-colors shrink-0">
                        <ArrowLeft size={20} className="md:w-6 md:h-6" />
                    </button>
                    <div className="min-w-0">
                        <h1 className="font-russo text-lg md:text-2xl text-white tracking-wide truncate">STUDIO</h1>
                        <p className="text-[10px] md:text-xs text-[#00E676] uppercase tracking-wider font-bold truncate hidden sm:block">Editor Corporativo</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* BOTÓN VISTA PREVIA */}
                    <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                        <DialogTrigger asChild>
                            <button className="flex items-center gap-2 px-3 md:px-6 py-2 md:py-3 rounded-xl bg-[#1E293B] border border-[#334155] hover:border-[#00E676] hover:text-[#00E676] transition-all font-bold uppercase text-[10px] md:text-xs tracking-widest">
                                <Eye size={16} /> <span className="hidden md:inline">Vista Previa</span>
                            </button>
                        </DialogTrigger>
                        <DialogContent className="p-0 border-none bg-transparent shadow-none w-auto max-w-none flex items-center justify-center">
                            <div className="relative w-[320px] h-[640px] md:w-[360px] md:h-[720px] bg-black rounded-[30px] md:rounded-[40px] shadow-2xl border-[8px] border-[#1E293B] overflow-hidden ring-4 ring-black/50">
                                <MobilePreview config={config} participantsMock={participantsMock} />
                            </div>
                        </DialogContent>
                    </Dialog>

                    <div className="h-6 w-px bg-[#334155] mx-1 md:h-8 md:mx-2"></div>

                    <button
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="px-3 md:px-6 py-2 md:py-3 rounded-xl bg-[#1E293B] text-white font-bold uppercase text-[10px] md:text-xs tracking-widest hover:bg-[#334155] transition-colors flex items-center gap-2 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} <span className="hidden md:inline">Guardar</span>
                    </button>

                    <button
                        onClick={handlePublish}
                        disabled={saving}
                        className="px-4 md:px-8 py-2 md:py-3 rounded-xl bg-gradient-to-r from-[#00E676] to-emerald-600 text-[#0F172A] font-black uppercase text-[10px] md:text-xs tracking-widest hover:scale-105 transition-transform flex items-center gap-2 shadow-[0_0_20px_rgba(0,230,118,0.3)] disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />} <span className="hidden lg:inline">Publicar</span>
                    </button>
                </div>
            </header>

            {/* CONTENIDO PRINCIPAL CENTRADO */}
            <main className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0B1120] to-[#0F172A] p-4 md:p-8">
                <div className="max-w-5xl mx-auto space-y-6 md:space-y-8 pb-20">

                    {/* TABS DE NAVEGACIÓN */}
                    <div className="flex gap-2 md:gap-4 p-2 bg-[#0F172A] rounded-2xl border border-[#1E293B] shadow-xl sticky top-2 z-40 backdrop-blur-md bg-opacity-90 overflow-x-auto">
                        <TabButton icon={Palette} label="Identidad" isActive={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
                        <TabButton icon={ImageIcon} label="Visuales" isActive={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
                        <TabButton icon={Megaphone} label="Publicidad" isActive={activeTab === 'ads'} onClick={() => setActiveTab('ads')} />
                        <TabButton icon={Share2} label="Redes Sociales" isActive={activeTab === 'social'} onClick={() => setActiveTab('social')} />
                        <TabButton icon={Type} label="Contenido" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                    </div>

                    {/* CONTENIDO DE LOS TABS */}
                    <div className="bg-[#151F32] border border-[#1E293B] rounded-3xl p-4 md:p-8 shadow-2xl min-h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-500">

                        {activeTab === 'branding' && (
                            <BrandingTab
                                config={config}
                                setConfig={setConfig}
                                fontOptions={fontOptions}
                            />
                        )}

                        {activeTab === 'assets' && (
                            <AssetsTab
                                config={config}
                                handleImageUpload={handleImageUpload}
                                uploadingState={uploadingState}
                            />
                        )}

                        {activeTab === 'ads' && (
                            <AdsTab
                                config={config}
                                setConfig={setConfig}
                                onUploadAdImage={handleAdImageUpload}
                                onRemoveAdImage={handleRemoveAdImage}
                                uploadingAd={uploadingState['ad_loading']}
                                planLevel={currentPlanLevel}
                            />
                        )}

                        {activeTab === 'social' && (
                            <SocialTab
                                config={config}
                                setConfig={setConfig}
                                planLevel={currentPlanLevel}
                            />
                        )}

                        {activeTab === 'content' && (
                            <ContentTab
                                config={config}
                                setConfig={setConfig}
                            />
                        )}

                    </div>
                </div>
            </main>

            {/* MODAL DE ACTIVACIÓN PENDIENTE */}
            {showActivation && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#151F32] border border-[#1E293B] rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center space-y-6">
                            <div className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-full bg-[#00E676]/10 flex items-center justify-center">
                                <Building2 size={32} className="text-[#00E676] md:w-10 md:h-10" />
                            </div>
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-white mb-2">Activación Pendiente</h2>
                                <p className="text-slate-400 text-xs md:text-sm leading-relaxed mb-4">
                                    Para publicar tu entorno empresarial, es necesario verificar el pago del plan seleccionado.
                                </p>
                            </div>

                            <PaymentMethods
                                leagueId={params.id as string}
                                amount={getPriceForPlan((config as any).packageType)}
                                onSuccess={() => {
                                    toast({ title: 'Pago enviado', description: 'Tu solicitud está en revisión.' });
                                    setShowActivation(false);
                                }}
                            />

                            <button onClick={() => setShowActivation(false)} className="text-slate-500 hover:text-white font-bold text-[10px] md:text-xs uppercase tracking-widest mt-4">
                                Cerrar y seguir editando
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}