'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, Save, ArrowLeft, Smartphone, Monitor } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { EnterpriseLeagueView } from '@/components/EnterpriseLeagueView';

export default function StudioPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Live Configuration State
    const [config, setConfig] = useState({
        brandColorPrimary: '#00E676',
        brandColorSecondary: '#1E293B',
        brandColorBg: '#0F172A',
        brandColorText: '#F8FAFC',
        companyName: '',
        welcomeMessage: '',
        brandingLogoUrl: '',
        brandCoverUrl: '', // New field
        isEnterprise: true,
        isEnterpriseActive: true
    });

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
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [params.id]);

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
            router.push(`/leagues/${params.id}`);
        } catch (error) {
            toast({ title: 'Error', description: 'No se pudo guardar la configuración.', variant: 'destructive' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-slate-950"><Loader2 className="animate-spin text-white" /></div>;

    // PREVIEW THEME INJECTION
    // We mock the injection by creating a style wrapper for the preview column
    const previewStyle = {
        '--brand-primary': config.brandColorPrimary,
        '--brand-secondary': config.brandColorSecondary,
        '--brand-bg': config.brandColorBg,
        '--brand-text': config.brandColorText,
        '--obsidian': config.brandColorBg,
        '--carbon': `color-mix(in srgb, ${config.brandColorBg}, white 10%)`,
        '--signal': config.brandColorPrimary,
        '--border': `color-mix(in srgb, ${config.brandColorBg}, white 20%)`,
    } as React.CSSProperties;

    // We emulate the "League" object for the EnterpriseView component
    const mockLeague = {
        id: 'preview',
        name: 'Vista Previa',
        ...config
    };

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden font-sans text-slate-200">

            {/* LEFT COLUMN: CONTROLS (30%) */}
            <div className="w-[400px] flex flex-col border-r border-slate-800 bg-slate-900/50">
                <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                    <button onClick={() => router.back()} className="hover:bg-slate-800 p-2 rounded-full transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-bold uppercase tracking-wider text-sm">Enterprise Studio</h2>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-brand-primary text-slate-950 px-4 py-1.5 rounded-full font-bold text-xs uppercase flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
                        style={{ backgroundColor: config.brandColorPrimary }}
                    >
                        {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                        Publicar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* SECTION: BRANDING COLORS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Colores de Marca</h3>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium block">Color Primario (Botones)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={config.brandColorPrimary}
                                        onChange={(e) => setConfig({ ...config, brandColorPrimary: e.target.value })}
                                        className="h-8 w-8 rounded bg-transparent border-none cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={config.brandColorPrimary}
                                        onChange={(e) => setConfig({ ...config, brandColorPrimary: e.target.value })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium block">Color Fondo (Obsidian)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={config.brandColorBg}
                                        onChange={(e) => setConfig({ ...config, brandColorBg: e.target.value })}
                                        className="h-8 w-8 rounded bg-transparent border-none cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={config.brandColorBg}
                                        onChange={(e) => setConfig({ ...config, brandColorBg: e.target.value })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium block">Color Texto</label>
                                <div className="flex gap-2">
                                    <input
                                        type="color"
                                        value={config.brandColorText}
                                        onChange={(e) => setConfig({ ...config, brandColorText: e.target.value })}
                                        className="h-8 w-8 rounded bg-transparent border-none cursor-pointer"
                                    />
                                    <input
                                        type="text"
                                        value={config.brandColorText}
                                        onChange={(e) => setConfig({ ...config, brandColorText: e.target.value })}
                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-2 text-xs font-mono"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* SECTION: ASSETS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Recursos Visuales</h3>

                        <div className="space-y-2">
                            <label className="text-xs font-medium block">URL Logo Corporativo</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={config.brandingLogoUrl || ''}
                                onChange={(e) => setConfig({ ...config, brandingLogoUrl: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-medium block">URL Banner Hero</label>
                            <input
                                type="text"
                                placeholder="https://..."
                                value={config.brandCoverUrl || ''}
                                onChange={(e) => setConfig({ ...config, brandCoverUrl: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs"
                            />
                        </div>
                    </div>

                    {/* SECTION: TEXTS */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">Identidad</h3>
                        <div className="space-y-2">
                            <label className="text-xs font-medium block">Nombre Empresa</label>
                            <input
                                type="text"
                                value={config.companyName || ''}
                                onChange={(e) => setConfig({ ...config, companyName: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium block">Mensaje Bienvenida</label>
                            <textarea
                                value={config.welcomeMessage || ''}
                                onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs h-20 resize-none"
                            />
                        </div>
                    </div>

                </div>
            </div>

            {/* RIGHT COLUMN: LIVE PREVIEW (70%) */}
            <div className="flex-1 bg-black flex flex-col relative">
                <div className="absolute top-4 right-4 z-50 bg-slate-900/80 backdrop-blur rounded-full p-1 flex border border-slate-700">
                    <button className="p-2 text-white bg-slate-700 rounded-full"><Monitor size={16} /></button>
                    {/* Future: Mobile Toggle <button className="p-2 text-slate-400 hover:text-white"><Smartphone size={16} /></button> */}
                </div>

                <div className="flex-1 overflow-y-auto" style={previewStyle}>
                    {/* The Runtime Engine Preview */}
                    {/* We wrap it in a div that mimics the layout injection */}
                    <div className="min-h-screen bg-obsidian text-brand-text transition-colors duration-200">
                        {/* Here we render the Landing Page Component directly to simulate the final result */}
                        <div className="pointer-events-none scale-[0.9] origin-top h-full w-full opacity-100 transition-all">
                            <EnterpriseLeagueView league={mockLeague} participants={participantsMock} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
