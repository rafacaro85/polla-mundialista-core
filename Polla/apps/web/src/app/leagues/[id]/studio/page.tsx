'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Save, ArrowLeft, Smartphone, Monitor,
    Palette, Type, Image as ImageIcon, Upload, LayoutTemplate,
    Building2, Trophy, Menu, Bell, Search, Award, Check
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

/* --- COMPONENTES UI DEL EDITOR (HELPERS) --- */

const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${isActive ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
    >
        <Icon size={18} /> {label}
    </button>
);

const SectionTitle = ({ title, subtitle }: any) => (
    <div className="mb-4">
        <h3 className="text-sm font-bold text-white mb-0.5">{title}</h3>
        <p className="text-xs text-slate-500">{subtitle}</p>
    </div>
);

const ColorPicker = ({ label, value, onChange }: any) => (
    <div className="flex items-center justify-between p-3 rounded-xl bg-[#0F172A] border border-[#1E293B] group hover:border-slate-600 transition-colors">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg shadow-sm border border-white/10" style={{ backgroundColor: value }}></div>
            <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-300 group-hover:text-white transition-colors">{label}</span>
                <span className="text-[10px] font-mono text-slate-500 uppercase">{value}</span>
            </div>
        </div>
        <div className="relative">
            <input
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-8 h-8 opacity-0 absolute inset-0 cursor-pointer z-20"
            />
            <div className="w-8 h-8 rounded-full bg-[#1E293B] flex items-center justify-center text-slate-400 hover:text-white cursor-pointer relative z-10 pointer-events-none">
                <Palette size={14} />
            </div>
        </div>
    </div>
);

const ImageUploader = ({ label, preview, onChange, placeholderIcon: Icon, aspect = "square" }: any) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 ml-1">{label}</label>
        <label className={`relative block w-full border-2 border-dashed border-[#1E293B] hover:border-[#00E676] hover:bg-[#00E676]/5 rounded-xl cursor-pointer transition-all group overflow-hidden ${aspect === 'video' ? 'aspect-video' : 'h-24'}`}>
            <input type="file" className="hidden" accept="image/*" onChange={onChange} />
            {preview ? (
                <div className="w-full h-full relative">
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-xs text-white font-bold flex items-center gap-2"><Upload size={14} /> Cambiar</span>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                    <Icon size={24} className="group-hover:text-[#00E676] transition-colors" />
                    <span className="text-[10px] uppercase font-bold tracking-widest">Subir Imagen</span>
                </div>
            )}
        </label>
    </div>
);

const InputGroup = ({ label, children }: any) => (
    <div className="space-y-2">
        <label className="text-xs font-bold text-slate-300 ml-1">{label}</label>
        {children}
    </div>
);

/* --- PAGINA PRINCIPAL STUDIO --- */

export default function StudioPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('branding');

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
        brandFontFamily: '"Russo One", sans-serif', // Nueva propiedad para la fuente
        isEnterprise: true,
        isEnterpriseActive: true
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

    // FUNCIÓN 1: Solo guardar cambios (sin redirigir)
    const handleSaveChanges = async () => {
        setSaving(true);
        try {
            await api.patch(`/leagues/${params.id}`, {
                brandColorPrimary: config.brandColorPrimary,
                brandColorSecondary: config.brandColorSecondary,
                brandColorBg: config.brandColorBg,
                brandColorText: config.brandColorText,
                brandFontFamily: config.brandFontFamily,
                brandingLogoUrl: config.brandingLogoUrl,
                brandCoverUrl: config.brandCoverUrl,
                companyName: config.companyName,
                welcomeMessage: config.welcomeMessage,
                isEnterprise: true,
            });

            toast({
                title: '💾 Cambios Guardados',
                description: 'Tu diseño se guardó correctamente.',
            });
        } catch (error: any) {
            console.error('Error al guardar:', error);

            if (error.response?.status === 413) {
                toast({
                    title: 'Imágenes muy pesadas',
                    description: 'Las imágenes son demasiado grandes. Optimízalas a menos de 500KB cada una.',
                    variant: 'destructive',
                    duration: 8000,
                });
            } else {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'No se pudo guardar.',
                    variant: 'destructive'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    // FUNCIÓN 2: Publicar (guardar + verificar + redirigir)
    const handlePublish = async () => {
        setSaving(true);
        try {
            // Guardar primero
            await api.patch(`/leagues/${params.id}`, {
                brandColorPrimary: config.brandColorPrimary,
                brandColorSecondary: config.brandColorSecondary,
                brandColorBg: config.brandColorBg,
                brandColorText: config.brandColorText,
                brandFontFamily: config.brandFontFamily,
                brandingLogoUrl: config.brandingLogoUrl,
                brandCoverUrl: config.brandCoverUrl,
                companyName: config.companyName,
                welcomeMessage: config.welcomeMessage,
                isEnterprise: true,
            });

            // Verificar si está activada
            const isActivated = config.isEnterpriseActive === true;

            if (!isActivated) {
                // ❌ NO ACTIVADA: Mostrar modal
                toast({
                    title: '🎨 Diseño Guardado',
                    description: 'Para publicar, solicita la activación de tu polla empresarial.',
                    duration: 6000,
                });
                showActivationModal();
            } else {
                // ✅ ACTIVADA: Redirigir con recarga completa para aplicar colores
                toast({
                    title: '✅ Publicando...',
                    description: 'Aplicando cambios a tu polla empresarial.',
                });

                // IMPORTANTE: Usar window.location.href para forzar recarga completa
                // Esto asegura que BrandThemeProvider se actualice con los nuevos colores
                setTimeout(() => {
                    window.location.href = `/leagues/${params.id}`;
                }, 1000);
            }
        } catch (error: any) {
            console.error('Error al publicar:', error);

            if (error.response?.status === 413) {
                toast({
                    title: 'Imágenes muy pesadas',
                    description: 'Optimiza las imágenes a menos de 500KB.',
                    variant: 'destructive',
                    duration: 8000,
                });
            } else {
                toast({
                    title: 'Error',
                    description: error.response?.data?.message || 'No se pudo publicar.',
                    variant: 'destructive'
                });
            }
        } finally {
            setSaving(false);
        }
    };

    // Modal de activación pendiente
    const [showActivation, setShowActivation] = useState(false);
    const showActivationModal = () => setShowActivation(true);

    const handleWhatsAppContact = () => {
        const phoneNumber = '573102345678'; // Reemplazar con número real de ventas
        const message = encodeURIComponent(
            `Hola! Quiero activar mi Polla Empresarial "${config.companyName}". Ya envié el comprobante de pago.`
        );
        window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
    };

    const handleImageUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast({ title: 'Archivo muy pesado', description: 'Máximo 2MB.', variant: 'destructive' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setConfig(prev => ({ ...prev, [key]: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#0B1120]"><Loader2 className="animate-spin text-[#00E676]" /></div>;

    // --- RENDERIZADO DE LA VISTA PREVIA ---
    const MobilePreviewContent = () => (
        <div
            className="min-h-full w-full flex flex-col font-sans transition-colors duration-300"
            style={{ backgroundColor: config.brandColorBg, color: config.brandColorText }}
        >
            {/* INYECTAR TODAS LAS FUENTES PARA QUE ESTÉN DISPONIBLES */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&family=Russo+One&family=Poppins:wght@400;700;900&family=Roboto+Slab:wght@400;700&display=swap');
                .custom-title-font { font-family: ${config.brandFontFamily}; }
            `}</style>

            {/* 1. HEADER (Logo Izquierda + Nombre) */}
            <header
                className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b shadow-sm backdrop-blur-md"
                style={{
                    backgroundColor: `${config.brandColorBg}F2`,
                    borderColor: `${config.brandColorSecondary}40`
                }}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-lg bg-white p-1 shrink-0 flex items-center justify-center shadow-sm">
                        {config.brandingLogoUrl ? (
                            <img src={config.brandingLogoUrl} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                            <Building2 className="text-slate-800 w-5 h-5" />
                        )}
                    </div>
                    <h1 className="custom-title-font text-base leading-tight truncate">
                        {config.companyName || 'TU EMPRESA'}
                    </h1>
                </div>
                <div className="flex gap-3 text-slate-400">
                    <Search size={18} />
                    <Bell size={18} />
                </div>
            </header>

            <main className="p-4 space-y-5 flex-1 overflow-y-auto">

                {/* 2. TARJETA DE PREMIO */}
                <div
                    className="rounded-2xl overflow-hidden shadow-lg border relative group"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}
                >
                    <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: `${config.brandColorText}10` }}>
                        <Award size={16} style={{ color: config.brandColorPrimary }} />
                        <span className="text-xs font-bold uppercase tracking-widest opacity-80">Premios Especiales</span>
                    </div>

                    <div className="w-full h-40 bg-slate-800 relative overflow-hidden">
                        {config.brandCoverUrl ? (
                            <img src={config.brandCoverUrl} alt="Premio" className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-900/50">
                                <ImageIcon size={32} className="opacity-50" />
                                <span className="text-[10px] mt-2 uppercase tracking-wider font-bold">Sin imagen de premio</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>
                        <div className="absolute bottom-3 left-4 right-4">
                            <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">
                                {config.welcomeMessage || 'Describe aquí el premio mayor...'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. TABLA DE POSICIONES (ESTÁTICA) */}
                <div
                    className="rounded-2xl p-4 shadow-lg border w-full"
                    style={{ backgroundColor: config.brandColorSecondary, borderColor: `${config.brandColorText}10` }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="custom-title-font text-lg flex items-center gap-2">
                            <Trophy size={18} className="text-yellow-400" /> TOP RANKING
                        </h2>
                        <span className="text-[10px] font-bold uppercase tracking-widest cursor-pointer opacity-70 hover:opacity-100">Ver Todo</span>
                    </div>

                    <div className="space-y-3">
                        {participantsMock.map((user) => (
                            <div
                                key={user.id}
                                className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-white/5"
                            >
                                <div className="custom-title-font text-lg w-6 text-center opacity-50">{user.rank}</div>
                                <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300 border border-white/10 shrink-0">
                                    {user.nickname.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-sm truncate">{user.nickname}</p>
                                    <p className="text-[10px] opacity-60 uppercase tracking-wide">Colaborador</p>
                                </div>
                                <div className="text-right">
                                    <span className="block font-black text-lg" style={{ color: config.brandColorPrimary }}>{user.points}</span>
                                    <span className="text-[9px] opacity-50 font-bold">PTS</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </main>

            {/* Bottom Nav Mock */}
            <div
                className="h-16 border-t flex items-center justify-around px-2 shrink-0 mt-auto"
                style={{ backgroundColor: config.brandColorBg, borderColor: `${config.brandColorText}10` }}
            >
                <div className="flex flex-col items-center gap-1 opacity-100" style={{ color: config.brandColorPrimary }}>
                    <LayoutTemplate size={20} />
                    <span className="text-[9px] font-bold">INICIO</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Trophy size={20} />
                    <span className="text-[9px] font-bold">RANKING</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-50">
                    <Menu size={20} />
                    <span className="text-[9px] font-bold">MENÚ</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans flex flex-col lg:flex-row overflow-hidden">

            {/* --- PANEL IZQUIERDO: HERRAMIENTAS --- */}
            <aside className="w-full lg:w-[400px] bg-[#151F32] border-r border-[#1E293B] flex flex-col h-[50vh] lg:h-screen shadow-2xl z-20">
                <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="hover:bg-white/10 p-2 rounded-full transition-colors mr-1">
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h1 className="font-bold text-white leading-tight">Enterprise Studio</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Editor de Marca</p>
                        </div>
                    </div>
                </div>

                <div className="flex border-b border-[#1E293B]">
                    <TabButton icon={Palette} label="Marca" isActive={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
                    <TabButton icon={ImageIcon} label="Recursos" isActive={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
                    <TabButton icon={Type} label="Contenido" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                    {activeTab === 'branding' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <SectionTitle title="Paleta de Colores" subtitle="Personaliza la apariencia general." />
                            <div className="space-y-4">
                                <ColorPicker label="Color Primario (Acentos)" value={config.brandColorPrimary} onChange={(v: string) => setConfig({ ...config, brandColorPrimary: v })} />
                                <ColorPicker label="Fondo (Obsidian)" value={config.brandColorBg} onChange={(v: string) => setConfig({ ...config, brandColorBg: v })} />
                                <ColorPicker label="Tarjetas (Surface)" value={config.brandColorSecondary} onChange={(v: string) => setConfig({ ...config, brandColorSecondary: v })} />
                                <ColorPicker label="Texto Principal" value={config.brandColorText} onChange={(v: string) => setConfig({ ...config, brandColorText: v })} />
                            </div>

                            <div className="pt-4 border-t border-[#1E293B]">
                                <SectionTitle title="Tipografía" subtitle="Estilo de letra para títulos y encabezados." />
                                <div className="grid grid-cols-2 gap-3">
                                    {fontOptions.map((font) => (
                                        <button
                                            key={font.name}
                                            onClick={() => setConfig({ ...config, brandFontFamily: font.value })}
                                            className={`p-3 rounded-xl border text-left text-xs transition-all relative ${config.brandFontFamily === font.value ? 'border-[#00E676] bg-[#00E676]/10 text-white' : 'border-[#1E293B] bg-[#0F172A] text-slate-400 hover:border-slate-600'}`}
                                        >
                                            <span className="block text-lg mb-1" style={{ fontFamily: font.value }}>Ag</span>
                                            {font.name}
                                            {config.brandFontFamily === font.value && <Check size={14} className="absolute top-2 right-2 text-[#00E676]" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'assets' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <SectionTitle title="Recursos Visuales" subtitle="Logotipo y banners." />
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 ml-1">Logotipo Corporativo</label>
                                <ImageUploader label="Subir Archivo Local" preview={config.brandingLogoUrl} onChange={(e: any) => handleImageUpload('brandingLogoUrl', e)} placeholderIcon={Building2} />
                            </div>
                            <div className="border-t border-[#1E293B] my-2"></div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 ml-1">Banner Premio</label>
                                <ImageUploader label="Subir Archivo Local" preview={config.brandCoverUrl} onChange={(e: any) => handleImageUpload('brandCoverUrl', e)} placeholderIcon={ImageIcon} aspect="video" />
                            </div>
                        </div>
                    )}

                    {activeTab === 'content' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <SectionTitle title="Identidad" subtitle="Información de la empresa." />
                            <InputGroup label="Nombre Empresa">
                                <input type="text" value={config.companyName} onChange={(e) => setConfig({ ...config, companyName: e.target.value })} className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-white focus:border-[#00E676] outline-none transition-colors" />
                            </InputGroup>
                            <InputGroup label="Mensaje Bienvenida (Descripción Premio)">
                                <textarea rows={4} value={config.welcomeMessage} onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })} className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-white focus:border-[#00E676] outline-none transition-colors resize-none" />
                            </InputGroup>
                        </div>
                    )}
                </div>

                <div className="p-5 border-t border-[#1E293B] bg-[#0F172A] flex gap-3">
                    {/* Botón Guardar */}
                    <button
                        onClick={handleSaveChanges}
                        disabled={saving}
                        className="flex-1 py-3 bg-[#1E293B] text-white border border-[#334155] font-black uppercase tracking-widest rounded-xl hover:bg-[#334155] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Guardar
                    </button>

                    {/* Botón Publicar */}
                    <button
                        onClick={handlePublish}
                        disabled={saving}
                        className="flex-1 py-3 bg-[#00E676] text-[#0F172A] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(0,230,118,0.3)]"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />} Publicar
                    </button>
                </div>
            </aside>

            {/* --- PANEL DERECHO: LIVE PREVIEW --- */}
            <main className="flex-1 bg-[#0B1120] relative flex items-center justify-center p-4 lg:p-10 h-[50vh] lg:h-screen overflow-hidden">
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>

                {/* Mobile Mockup */}
                <div className="relative w-full max-w-[360px] h-full max-h-[720px] bg-black rounded-[40px] shadow-2xl border-[8px] border-[#1E293B] overflow-hidden flex flex-col transition-all duration-500 ring-4 ring-black/50">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-50 flex justify-center items-end pb-1">
                        <div className="w-12 h-1 bg-[#1E293B] rounded-full"></div>
                    </div>

                    {/* Render Content */}
                    <div className="flex-1 overflow-hidden relative bg-black">
                        <MobilePreviewContent />
                    </div>

                    {/* Reflection */}
                    <div className="absolute inset-0 rounded-[32px] pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-50"></div>
                </div>

                <div className="absolute top-6 right-6 hidden lg:flex gap-2 bg-[#151F32] p-1 rounded-lg border border-[#1E293B]">
                    <button className="p-2 rounded-md bg-[#00E676] text-[#0F172A]"><Smartphone size={16} /></button>
                    <button className="p-2 rounded-md text-slate-500 hover:text-white"><Monitor size={16} /></button>
                </div>
            </main>

            {/* MODAL DE ACTIVACIÓN PENDIENTE */}
            {showActivation && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-[#151F32] border border-[#1E293B] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center space-y-6">
                            {/* Icon */}
                            <div className="w-20 h-20 mx-auto rounded-full bg-[#00E676]/10 flex items-center justify-center">
                                <Building2 size={40} className="text-[#00E676]" />
                            </div>

                            {/* Title */}
                            <div>
                                <h2 className="text-2xl font-black text-white mb-2">Activación Pendiente</h2>
                                <p className="text-slate-400 text-sm leading-relaxed">
                                    Tu diseño se ha guardado correctamente. Para publicar tu Polla Empresarial y que tus colaboradores puedan acceder, necesitas activar el servicio.
                                </p>
                            </div>

                            {/* Steps */}
                            <div className="bg-[#0F172A] rounded-xl p-4 text-left space-y-3">
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#00E676] text-[#0F172A] flex items-center justify-center text-xs font-black shrink-0">1</div>
                                    <p className="text-xs text-slate-300">Realiza el pago del servicio</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#00E676] text-[#0F172A] flex items-center justify-center text-xs font-black shrink-0">2</div>
                                    <p className="text-xs text-slate-300">Envía el comprobante a nuestro equipo de ventas</p>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="w-6 h-6 rounded-full bg-[#00E676] text-[#0F172A] flex items-center justify-center text-xs font-black shrink-0">3</div>
                                    <p className="text-xs text-slate-300">Nuestro equipo activará tu polla en minutos</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="space-y-3">
                                <button
                                    onClick={handleWhatsAppContact}
                                    className="w-full py-4 bg-[#25D366] hover:bg-[#20BA5A] text-white font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-105"
                                >
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Contactar Ventas
                                </button>
                                <button
                                    onClick={() => setShowActivation(false)}
                                    className="w-full py-3 text-slate-400 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}