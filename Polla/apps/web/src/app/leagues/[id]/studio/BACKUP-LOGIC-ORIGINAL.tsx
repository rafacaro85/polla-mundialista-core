'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    Loader2, Save, ArrowLeft, Smartphone, Monitor,
    Palette, Type, Image as ImageIcon, Upload, LayoutTemplate,
    RefreshCw, Building2
} from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
// Asegúrate de que este componente acepte 'league' y 'participants' como props
import { EnterpriseLeagueView } from '@/components/EnterpriseLeagueView';

/* --- COMPONENTES UI DEL EDITOR --- */

const TabButton = ({ icon: Icon, label, isActive, onClick }: any) => (
    <button
        onClick={onClick}
        className={`flex-1 py-4 flex flex-col items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors border-b-2 ${isActive ? 'border-[#00E676] text-[#00E676] bg-[#00E676]/5' : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'}`}
    >
        <Icon size={18} /> {label}
    </button>
);

const SectionTitle = ({ title, subtitle }: any) => (
    <div>
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
        brandColorSecondary: '#1E293B', // Usado como Surface/Cards
        brandColorBg: '#0F172A',
        brandColorText: '#F8FAFC',
        companyName: '',
        welcomeMessage: '',
        brandingLogoUrl: '',
        brandCoverUrl: '',
        isEnterprise: true,
        isEnterpriseActive: true
    });

    // Mock Data for Preview
    const [participantsMock] = useState([
        { id: '1', nickname: 'Campeón', rank: 1, points: 150, avatarUrl: '' },
        { id: '2', nickname: 'Retador', rank: 2, points: 145, avatarUrl: '' },
        { id: '3', nickname: 'Novato', rank: 3, points: 120, avatarUrl: '' },
    ]);

    useEffect(() => {
        const load = async () => {
            try {
                // Ajusta esto según tu API real. Si get /leagues/my devuelve todas, ok.
                // Si existe un endpoint específico /leagues/:id, úsalo mejor.
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

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.patch(`/leagues/${params.id}`, {
                brandColorPrimary: config.brandColorPrimary,
                brandColorSecondary: config.brandColorSecondary,
                brandColorBg: config.brandColorBg,
                brandColorText: config.brandColorText,
                brandingLogoUrl: config.brandingLogoUrl,
                brandCoverUrl: config.brandCoverUrl,
                companyName: config.companyName,
                welcomeMessage: config.welcomeMessage,
                isEnterprise: true,
                isEnterpriseActive: true
            });
            toast({ title: 'Configuración Guardada', description: 'Los cambios se han aplicado a toda la polla.' });
            // router.push(`/leagues/${params.id}`); // Opcional: Quedarse en el studio
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Check file size (limit to 1MB to avoid 413 Payload Too Large)
            if (file.size > 1 * 1024 * 1024) {
                toast({
                    title: 'Archivo muy pesado',
                    description: 'La imagen debe pesar menos de 1MB. Por favor optimízala.',
                    variant: 'destructive'
                });
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

    // Objeto League simulado para el Preview
    const mockLeagueForPreview = {
        id: 'preview',
        name: config.companyName || 'Vista Previa',
        ...config
    };

    // Estilos dinámicos para inyectar en el contenedor de preview
    const previewContainerStyle = {
        '--brand-primary': config.brandColorPrimary,
        '--brand-secondary': config.brandColorSecondary,
        '--brand-bg': config.brandColorBg,
        '--brand-text': config.brandColorText,
        backgroundColor: config.brandColorBg,
        color: config.brandColorText,
    } as React.CSSProperties;

    return (
        <div className="min-h-screen bg-[#0B1120] text-slate-200 font-sans flex flex-col lg:flex-row overflow-hidden">

            {/* INYECCIÓN DE FUENTES */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Russo+One&display=swap');
            `}</style>

            {/* --- PANEL IZQUIERDO: HERRAMIENTAS (350px - 400px) --- */}
            <aside className="w-full lg:w-[400px] bg-[#151F32] border-r border-[#1E293B] flex flex-col h-[50vh] lg:h-screen shadow-2xl z-20">

                {/* Header Editor */}
                <div className="p-5 border-b border-[#1E293B] flex items-center justify-between bg-[#0F172A]">
                    <div className="flex items-center gap-3">
                        <button onClick={() => router.back()} className="hover:bg-white/10 p-2 rounded-full transition-colors mr-1">
                            <ArrowLeft size={18} />
                        </button>
                        <div className="bg-[#00E676] p-2 rounded-lg text-[#0F172A]">
                            <LayoutTemplate size={20} />
                        </div>
                        <div>
                            <h1 className="font-bold text-white leading-tight">Enterprise Studio</h1>
                            <p className="text-[10px] text-slate-400 uppercase tracking-widest">Editor de Marca</p>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-[#1E293B]">
                    <TabButton icon={Palette} label="Marca" isActive={activeTab === 'branding'} onClick={() => setActiveTab('branding')} />
                    <TabButton icon={ImageIcon} label="Recursos" isActive={activeTab === 'assets'} onClick={() => setActiveTab('assets')} />
                    <TabButton icon={Type} label="Contenido" isActive={activeTab === 'content'} onClick={() => setActiveTab('content')} />
                </div>

                {/* Scroll Area Herramientas */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* TAB: MARCA */}
                    {activeTab === 'branding' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <SectionTitle title="Paleta de Colores" subtitle="Define la identidad visual de tu portal." />
                            <div className="space-y-4">
                                <ColorPicker
                                    label="Color Primario (Botones/Acentos)"
                                    value={config.brandColorPrimary}
                                    onChange={(v: string) => setConfig({ ...config, brandColorPrimary: v })}
                                />
                                <ColorPicker
                                    label="Fondo Principal (Obsidian)"
                                    value={config.brandColorBg}
                                    onChange={(v: string) => setConfig({ ...config, brandColorBg: v })}
                                />
                                <ColorPicker
                                    label="Superficies / Tarjetas"
                                    value={config.brandColorSecondary}
                                    onChange={(v: string) => setConfig({ ...config, brandColorSecondary: v })}
                                />
                                <ColorPicker
                                    label="Color de Texto"
                                    value={config.brandColorText}
                                    onChange={(v: string) => setConfig({ ...config, brandColorText: v })}
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB: RECURSOS */}
                    {activeTab === 'assets' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <SectionTitle title="Logotipo" subtitle="Sube el logo de la empresa (PNG transparente ideal)." />
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 ml-1">URL Logo (o sube archivo)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={config.brandingLogoUrl || ''}
                                    onChange={(e) => setConfig({ ...config, brandingLogoUrl: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-xs text-slate-300 focus:border-[#00E676] outline-none"
                                />
                                <ImageUploader
                                    label="Subir Archivo Local"
                                    preview={config.brandingLogoUrl}
                                    onChange={(e: any) => handleImageUpload('brandingLogoUrl', e)}
                                    placeholderIcon={Building2}
                                />
                            </div>

                            <div className="border-t border-[#1E293B] my-4"></div>

                            <SectionTitle title="Banner Hero" subtitle="Imagen impactante para el premio o cabecera." />
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-300 ml-1">URL Banner (o sube archivo)</label>
                                <input
                                    type="text"
                                    placeholder="https://..."
                                    value={config.brandCoverUrl || ''}
                                    onChange={(e) => setConfig({ ...config, brandCoverUrl: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-xs text-slate-300 focus:border-[#00E676] outline-none"
                                />
                                <ImageUploader
                                    label="Subir Archivo Local"
                                    preview={config.brandCoverUrl}
                                    onChange={(e: any) => handleImageUpload('brandCoverUrl', e)}
                                    placeholderIcon={ImageIcon}
                                    aspect="video"
                                />
                            </div>
                        </div>
                    )}

                    {/* TAB: CONTENIDO */}
                    {activeTab === 'content' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            <SectionTitle title="Identidad del Torneo" subtitle="Textos que verán tus colaboradores." />
                            <InputGroup label="Nombre de la Empresa / Torneo">
                                <input
                                    type="text"
                                    value={config.companyName}
                                    onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-white focus:border-[#00E676] outline-none transition-colors"
                                />
                            </InputGroup>
                            <InputGroup label="Mensaje de Bienvenida / Premio">
                                <textarea
                                    rows={4}
                                    value={config.welcomeMessage}
                                    onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                                    className="w-full bg-[#0F172A] border border-[#1E293B] rounded-lg p-3 text-white focus:border-[#00E676] outline-none transition-colors resize-none"
                                    placeholder="Ej: ¡Bienvenidos a la polla! El ganador se lleva un viaje..."
                                />
                            </InputGroup>
                        </div>
                    )}

                </div>

                {/* Footer Actions */}
                <div className="p-5 border-t border-[#1E293B] bg-[#0F172A] flex gap-3">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex-1 py-3 bg-[#00E676] text-[#0F172A] font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        Publicar Cambios
                    </button>
                </div>
            </aside>

            {/* --- PANEL DERECHO: LIVE PREVIEW --- */}
            <main className="flex-1 bg-[#0B1120] relative flex items-center justify-center p-4 lg:p-10 h-[50vh] lg:h-screen overflow-hidden">

                {/* Background Grid Pattern */}
                <div className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(#1E293B 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
                </div>

                {/* Mobile Device Simulation */}
                <div className="relative w-full max-w-[380px] h-full max-h-[750px] bg-black rounded-[40px] shadow-2xl border-[8px] border-[#1E293B] overflow-hidden flex flex-col transition-all duration-500 ring-4 ring-black/50">

                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-black rounded-b-xl z-50 flex justify-center items-end pb-1">
                        <div className="w-12 h-1 bg-[#1E293B] rounded-full"></div>
                    </div>

                    {/* LIVE PREVIEW CONTENT */}
                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar" style={previewContainerStyle}>
                        {/* Aquí renderizamos tu componente real 'EnterpriseLeagueView'.
                            Este componente DEBE usar las variables CSS o los colores del objeto 'league' 
                            para que los cambios se reflejen en tiempo real.
                        */}
                        <div className="min-h-full">
                            <EnterpriseLeagueView
                                league={mockLeagueForPreview}
                                participants={participantsMock}
                            />
                        </div>
                    </div>

                    {/* Reflection Overlay */}
                    <div className="absolute inset-0 rounded-[32px] pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)] z-50"></div>
                </div>

                {/* Toggle Buttons (Decorativos por ahora) */}
                <div className="absolute top-6 right-6 hidden lg:flex gap-2 bg-[#151F32] p-1 rounded-lg border border-[#1E293B]">
                    <button className="p-2 rounded-md bg-[#00E676] text-[#0F172A]"><Smartphone size={16} /></button>
                    <button className="p-2 rounded-md text-slate-500 hover:text-white"><Monitor size={16} /></button>
                </div>

            </main>

        </div>
    );
}
