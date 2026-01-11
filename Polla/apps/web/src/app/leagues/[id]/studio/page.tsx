"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Save, ArrowLeft,
    Palette, Type, Image as ImageIcon, Upload,
    Building2, Check, Shield, Eye, Trophy
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { MobilePreview } from './MobilePreview';

/* --- COMPONENTES UI DEL EDITOR (HELPERS) --- */

const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 min-w-[100px] py-3 md:py-4 flex flex-col items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider transition-all rounded-xl border-2 ${isActive
            ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/10 shadow-[0_0_15px_rgba(0,230,118,0.1)]'
            : 'border-transparent bg-[#1E293B] text-slate-400 hover:text-white hover:bg-[#334155]'
            }`}
    >
        <Icon size={20} className="md:w-6 md:h-6" />
        <span className="text-center leading-tight">{label}</span>
    </button>
);

const SectionTitle = ({ title, subtitle }: any) => (
    <div className="mb-6">
        <h3 className="text-lg font-russo text-white mb-1 uppercase italic">{title}</h3>
        <p className="text-sm text-slate-400 font-medium">{subtitle}</p>
    </div>
);

const ColorPicker = ({ label, value, onChange }: any) => {
    const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value;
        if (val.startsWith('#')) val = val.substring(1);

        // Solo caracteres hex válidos
        if (/^[0-9A-Fa-f]*$/.test(val)) {
            if (val.length <= 6) {
                onChange(`#${val}`);
            }
        }
    };

    return (
        <div className="flex items-center justify-between p-3 md:p-4 rounded-2xl bg-[#1E293B] border border-[#334155] group hover:border-[#00E676]/50 transition-colors">
            <div className="flex items-center gap-4 flex-1 overflow-hidden">
                {/* Muestra de color + Input Nativo Oculto */}
                <div className="relative w-12 h-12 rounded-xl shadow-lg border-2 border-white/10 shrink-0 overflow-hidden cursor-pointer group/picker">
                    <div className="absolute inset-0 transition-colors" style={{ backgroundColor: value }} />
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover/picker:opacity-100 transition-opacity pointer-events-none">
                        <Palette size={18} className="text-white drop-shadow-md" />
                    </div>
                </div>

                <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <span className="text-sm font-bold text-slate-200 truncate">{label}</span>

                    {/* Input Hexadecimal Unificado */}
                    <div className="flex items-center bg-[#0F172A] rounded-lg border border-[#334155] focus-within:border-[#00E676] px-3 py-1.5 w-full max-w-[140px] transition-colors">
                        <span className="text-xs font-mono text-slate-500 font-bold mr-1 select-none">#</span>
                        <input
                            type="text"
                            value={value.replace('#', '').toUpperCase()}
                            onChange={handleHexChange}
                            className="bg-transparent border-none outline-none text-xs font-mono text-slate-300 w-full uppercase placeholder:text-slate-600 tracking-wider"
                            placeholder="000000"
                            maxLength={6}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

const ImageUploader = ({ label, preview, onChange, uploading, placeholderIcon: Icon, aspect = "square" }: any) => (
    <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wide">{label}</label>
        <label className={`relative block w-full border-2 border-dashed border-[#334155] hover:border-[#00E676] hover:bg-[#00E676]/5 rounded-2xl cursor-pointer transition-all group overflow-hidden ${aspect === 'video' ? 'aspect-video' : 'h-32 md:h-40'}`}>
            <input type="file" className="hidden" accept="image/*" onChange={onChange} disabled={uploading} />
            {uploading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-black/50">
                    <Loader2 className="animate-spin text-[#00E676]" size={32} />
                    <span className="text-xs text-[#00E676] font-bold uppercase tracking-widest">Subiendo...</span>
                </div>
            ) : preview ? (
                <div className="w-full h-full relative">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <span className="text-sm text-white font-bold flex items-center gap-2 uppercase tracking-wide bg-black/50 px-4 py-2 rounded-full border border-white/20">
                            <Upload size={16} /> <span className="hidden sm:inline">Cambiar Imagen</span>
                        </span>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-3 group-hover:scale-105 transition-transform p-4 text-center">
                    <div className="p-3 md:p-4 bg-[#1E293B] rounded-full group-hover:bg-[#00E676] group-hover:text-[#0F172A] transition-colors">
                        <Icon size={24} className="md:w-8 md:h-8" />
                    </div>
                    <span className="text-[10px] md:text-xs uppercase font-bold tracking-widest group-hover:text-[#00E676] transition-colors">Click para subir</span>
                </div>
            )}
        </label>
    </div>
);

const InputGroup = ({ label, children }: any) => (
    <div className="space-y-3">
        <label className="text-sm font-bold text-slate-300 ml-1 uppercase tracking-wide">{label}</label>
        {children}
    </div>
);

/* --- PÁGINA PRINCIPAL STUDIO --- */

export default function StudioPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('branding');
    const [previewOpen, setPreviewOpen] = useState(false);
    const [uploadingState, setUploadingState] = useState<Record<string, boolean>>({});

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
        prizeImageUrl: '', // Agregado
        brandFontFamily: '"Russo One", sans-serif',
        isEnterprise: true,
        isEnterpriseActive: true,
        enableDepartmentWar: false,
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

    useEffect(() => {
        const load = async () => {
            try {
                const { data: myLeagues } = await api.get('/leagues/my');
                const found = myLeagues.find((l: any) => l.id === params.id);
                if (found) {
                    setConfig(prev => ({ ...prev, ...found }));
                }
            } catch (e) {
                console.error(e);
                toast({ title: 'Error', description: 'No se pudo cargar la información.', variant: 'destructive' });
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params.id, toast]);

    // MANEJO DE SUBIDA DE IMÁGENES (CLOUDINARY)
    const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast({ title: 'Archivo muy pesado', description: 'Máximo 5MB.', variant: 'destructive' });
            return;
        }

        try {
            setUploadingState(prev => ({ ...prev, [key]: true }));
            const formData = new FormData();
            formData.append('file', file);

            // Subir al endpoint centralizado
            const { data } = await api.post('/upload', formData);

            // Actualizar config con la URL real
            setConfig(prev => ({ ...prev, [key]: data.url }));
            toast({ title: 'Imagen subida', description: 'Se ha actualizado la imagen correctamente.' });

        } catch (error) {
            console.error('Error uploading:', error);
            toast({ title: 'Error subiendo imagen', description: 'Intenta de nuevo.', variant: 'destructive' });
        } finally {
            setUploadingState(prev => ({ ...prev, [key]: false }));
        }
    };

    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            // Evitar enviar isEnterpriseActive para no sobrescribir el estado admin
            const { isEnterpriseActive, ...cleanConfig } = config;

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
            const { isEnterpriseActive, ...cleanConfig } = config;

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
                        <TabButton icon={Type} label="Contenido" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                    </div>

                    {/* CONTENIDO DE LOS TABS */}
                    <div className="bg-[#151F32] border border-[#1E293B] rounded-3xl p-4 md:p-8 shadow-2xl min-h-[500px] animate-in slide-in-from-bottom-4 fade-in duration-500">

                        {activeTab === 'branding' && (
                            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                                <div>
                                    <SectionTitle title="Colores" subtitle="Define la paleta de colores." />
                                    <div className="space-y-4">
                                        <ColorPicker label="Color Primario" value={config.brandColorPrimary} onChange={(v: string) => setConfig({ ...config, brandColorPrimary: v })} />
                                        <ColorPicker label="Fondo Oscuro" value={config.brandColorBg} onChange={(v: string) => setConfig({ ...config, brandColorBg: v })} />
                                        <ColorPicker label="Tarjetas" value={config.brandColorSecondary} onChange={(v: string) => setConfig({ ...config, brandColorSecondary: v })} />
                                        <ColorPicker label="Textos" value={config.brandColorText} onChange={(v: string) => setConfig({ ...config, brandColorText: v })} />
                                    </div>
                                </div>
                                <div>
                                    <SectionTitle title="Tipografía" subtitle="Selecciona la fuente para títulos." />
                                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                                        {fontOptions.map((font) => (
                                            <button
                                                key={font.name}
                                                onClick={() => setConfig({ ...config, brandFontFamily: font.value })}
                                                className={`p-4 md:p-6 rounded-2xl border-2 text-left transition-all relative hover:scale-[1.02] ${config.brandFontFamily === font.value
                                                    ? 'border-[#00E676] bg-[#00E676]/5 text-white shadow-lg'
                                                    : 'border-[#334155] bg-[#0F172A] text-slate-400 hover:border-slate-500'}`}
                                            >
                                                <span className="block text-2xl md:text-3xl mb-2" style={{ fontFamily: font.value }}>Ag</span>
                                                <span className="text-[10px] md:text-xs font-bold uppercase tracking-wide block truncate">{font.name}</span>
                                                {config.brandFontFamily === font.value && <div className="absolute top-2 right-2 md:top-3 md:right-3 w-5 h-5 md:w-6 md:h-6 bg-[#00E676] rounded-full flex items-center justify-center text-[#0F172A]"><Check size={12} strokeWidth={3} /></div>}
                                            </button>
                                        ))}
                                    </div>

                                    {/* WAR TOGGLE */}
                                    <div className="mt-8 p-4 md:p-6 bg-[#0F172A] rounded-2xl border border-[#334155]">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <h4 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wide mb-1">
                                                    <Shield size={16} className="text-[#00E676]" /> Guerra de Áreas
                                                </h4>
                                                <p className="text-[10px] md:text-xs text-slate-400">Competencia de departamentos.</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                                <input
                                                    type="checkbox"
                                                    checked={!!config.enableDepartmentWar}
                                                    onChange={(e) => setConfig({ ...config, enableDepartmentWar: e.target.checked })}
                                                    className="sr-only peer"
                                                />
                                                <div className="w-12 h-6 md:w-14 md:h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 md:after:h-6 md:after:w-6 after:transition-all peer-checked:bg-[#00E676]"></div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'assets' && (
                            <div className="grid md:grid-cols-2 gap-8 md:gap-12">
                                <div>
                                    <SectionTitle title="Logotipo" subtitle="Logo (PNG transparente)." />
                                    <ImageUploader
                                        label="Logo Corporativo"
                                        preview={config.brandingLogoUrl}
                                        onChange={(e: any) => handleImageUpload('brandingLogoUrl', e)}
                                        uploading={uploadingState['brandingLogoUrl']}
                                        placeholderIcon={Building2}
                                    />
                                </div>
                                {/* Bloque de portada eliminado por solicitud */}
                                {/* Nueva sección para imagen del premio */}
                                <div className="md:col-span-2">
                                    <SectionTitle title="Imagen del Premio" subtitle="Muestra el gran premio (16:9)." />
                                    <ImageUploader
                                        label="Premio Mayor"
                                        preview={config.prizeImageUrl}
                                        onChange={(e: any) => handleImageUpload('prizeImageUrl', e)}
                                        uploading={uploadingState['prizeImageUrl']}
                                        placeholderIcon={Trophy}
                                        aspect="video"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'content' && (
                            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
                                <SectionTitle title="Información General" subtitle="Detalles visibles para todos." />

                                <InputGroup label="Nombre Organización">
                                    <input
                                        type="text"
                                        value={config.companyName}
                                        onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                                        className="w-full bg-[#0F172A] border-2 border-[#334155] rounded-xl p-3 md:p-4 text-white text-base md:text-lg focus:border-[#00E676] outline-none transition-colors placeholder:text-slate-600 font-medium"
                                        placeholder="Ej: Copa Tech 2026"
                                    />
                                </InputGroup>

                                <InputGroup label="Mensaje Bienvenida">
                                    <textarea
                                        rows={6}
                                        value={config.welcomeMessage}
                                        onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                                        className="w-full bg-[#0F172A] border-2 border-[#334155] rounded-xl p-3 md:p-4 text-white focus:border-[#00E676] outline-none transition-colors resize-none text-sm leading-relaxed placeholder:text-slate-600"
                                        placeholder="Describe los premios..."
                                    />
                                </InputGroup>
                            </div>
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
                                <p className="text-slate-400 text-xs md:text-sm leading-relaxed">
                                    Configuración guardada. Contáctanos para activar tu liga.
                                </p>
                            </div>
                            <button
                                onClick={handleWhatsAppContact}
                                className="w-full py-3 md:py-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105 text-sm"
                            >
                                Contactar Ventas
                            </button>
                            <button onClick={() => setShowActivation(false)} className="text-slate-500 hover:text-white font-bold text-[10px] md:text-xs uppercase tracking-widest">
                                Cerrar y seguir editando
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}